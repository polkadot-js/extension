// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, BasicTxInfo, ChainBondingBasics, DelegationItem, NetworkJson, TuringStakeCompoundResp, UnlockingStakeInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { BOND_LESS_ACTION, calculateChainStakedReturn, ERA_LENGTH_MAP, getParaCurrentInflation, InflationConfig, PARACHAIN_INFLATION_DISTRIBUTION, REVOKE_ACTION, TuringOptimalCompoundFormat } from '@subwallet/extension-koni-base/api/bonding/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { parseNumberToDisplay, parseRawNumber, reformatAddress } from '@subwallet/extension-koni-base/utils';
import Web3 from 'web3';

import { BN } from '@polkadot/util';

interface CollatorExtraInfo {
  active: boolean,
  identity?: string,
  isVerified: boolean,
  delegationCount: number,
  bond: number,
  minDelegation: number
}

interface CollatorInfo {
  owner: string;
  amount: string;
}

export async function getParaBondingBasics (networkKey: string, dotSamaApi: ApiProps) {
  const apiProps = await dotSamaApi.isReady;

  const _round = (await apiProps.api.query.parachainStaking.round()).toHuman() as Record<string, string>;
  const round = parseRawNumber(_round.current);

  let _unvestedAllocation;

  if (apiProps.api.query.vesting && apiProps.api.query.vesting.totalUnvestedAllocation) {
    _unvestedAllocation = await apiProps.api.query.vesting.totalUnvestedAllocation();
  }

  const [_totalStake, _totalIssuance, _inflation, _allCollators] = await Promise.all([
    apiProps.api.query.parachainStaking.staked(round),
    apiProps.api.query.balances.totalIssuance(),
    apiProps.api.query.parachainStaking.inflationConfig(),
    apiProps.api.query.parachainStaking.candidatePool()
  ]);

  const rawAllCollators = _allCollators.toHuman() as unknown as CollatorInfo[];

  let unvestedAllocation;

  if (_unvestedAllocation) {
    const rawUnvestedAllocation = _unvestedAllocation.toHuman() as string;

    unvestedAllocation = parseRawNumber(rawUnvestedAllocation);
  }

  const rawTotalStake = _totalStake.toHuman() as string;
  const totalStake = parseRawNumber(rawTotalStake);

  const rawTotalIssuance = _totalIssuance.toHuman() as string;
  let totalIssuance = parseRawNumber(rawTotalIssuance);

  if (unvestedAllocation) {
    totalIssuance += unvestedAllocation; // for Turing network, read more at https://hackmd.io/@sbAqOuXkRvyiZPOB3Ryn6Q/Sypr3ZJh5
  }

  const inflationConfig = _inflation.toHuman() as unknown as InflationConfig;
  const currentInflation = getParaCurrentInflation(totalStake, inflationConfig);
  const rewardDistribution = PARACHAIN_INFLATION_DISTRIBUTION[networkKey] ? PARACHAIN_INFLATION_DISTRIBUTION[networkKey].reward : PARACHAIN_INFLATION_DISTRIBUTION.default.reward;
  const rewardPool = currentInflation * rewardDistribution;

  const stakedReturn = calculateChainStakedReturn(rewardPool, totalStake, totalIssuance, networkKey);

  return {
    isMaxNominators: false,
    stakedReturn,
    validatorCount: rawAllCollators.length
  } as ChainBondingBasics;
}

export async function getParaCollatorsInfo (networkKey: string, dotSamaApi: ApiProps, decimals: number, address: string) {
  const apiProps = await dotSamaApi.isReady;

  const allValidators: ValidatorInfo[] = [];

  const [_allCollators, _delegatorState, _collatorCommission] = await Promise.all([
    apiProps.api.query.parachainStaking.candidatePool(),
    apiProps.api.query.parachainStaking.delegatorState(address),
    apiProps.api.query.parachainStaking.collatorCommission()
  ]);

  const _maxDelegatorPerCandidate = apiProps.api.consts.parachainStaking.maxTopDelegationsPerCandidate.toHuman() as string;
  const maxDelegatorPerCandidate = parseRawNumber(_maxDelegatorPerCandidate);

  const _maxDelegationCount = apiProps.api.consts.parachainStaking.maxDelegationsPerDelegator.toHuman() as string;
  const maxDelegationCount = parseRawNumber(_maxDelegationCount);

  const _chainMinDelegation = apiProps.api.consts.parachainStaking.minDelegation.toHuman() as string;
  const chainMinDelegation = parseRawNumber(_chainMinDelegation);

  const rawDelegatorState = _delegatorState.toHuman() as Record<string, any> | null;
  const rawAllCollators = _allCollators.toHuman() as unknown as CollatorInfo[];

  const rawCollatorCommission = _collatorCommission.toHuman() as string;
  const collatorCommission = parseFloat(rawCollatorCommission.split('%')[0]);

  for (const collator of rawAllCollators) {
    allValidators.push({
      commission: 0,
      expectedReturn: 0,
      address: collator.owner,
      totalStake: parseRawNumber(collator.amount) / 10 ** decimals,
      ownStake: 0,
      otherStake: 0,
      nominatorCount: 0,
      blocked: false,
      isVerified: false,
      minBond: 0,
      isNominated: false
    });
  }

  const bondedValidators: string[] = [];

  if (rawDelegatorState !== null) {
    const validatorList = rawDelegatorState.delegations as Record<string, any>[];

    for (const _validator of validatorList) {
      bondedValidators.push(_validator.owner as string);
    }
  }

  let currentBondingValidators: string[] = [];
  let existingRequestsMap: Record<string, boolean> = {};

  if (['bifrost', 'bifrost_testnet'].includes(networkKey)) {
    if (rawDelegatorState !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const unbondingRequests = rawDelegatorState.requests.requests as Record<string, Record<string, string>>;

      const result = getBifrostBondedValidators(bondedValidators, unbondingRequests);

      currentBondingValidators = result.currentBondingValidators;
      existingRequestsMap = result.existingRequestsMap;
    } else {
      currentBondingValidators = bondedValidators;
    }
  } else {
    // double-check bondedValidators to see if exist unbonding request
    await Promise.all(bondedValidators.map(async (validator) => {
      const rawScheduledRequests = (await apiProps.api.query.parachainStaking.delegationScheduledRequests(validator)).toHuman() as Record<string, any>[] | null;

      if (rawScheduledRequests === null) {
        currentBondingValidators.push(validator);
      } else {
        let foundRevokeRequest = false;

        for (const scheduledRequest of rawScheduledRequests) {
          const delegator = scheduledRequest.delegator as string;
          const formattedDelegator = reformatAddress(delegator, 0);
          const formattedAddress = reformatAddress(address, 0);

          if (formattedAddress === formattedDelegator) { // returned data might not have the same address format
            const _action = scheduledRequest.action as Record<string, string>;
            const action = Object.keys(_action)[0];

            existingRequestsMap[validator] = true;

            if (action.toLowerCase() !== REVOKE_ACTION) {
              currentBondingValidators.push(validator);
              break;
            } else {
              foundRevokeRequest = true;
              break;
            }
          }
        }

        if (!foundRevokeRequest) {
          currentBondingValidators.push(validator);
        }
      }
    }));
  }

  const extraInfoMap: Record<string, CollatorExtraInfo> = {};

  await Promise.all(allValidators.map(async (validator) => {
    const [_info, _identity] = await Promise.all([
      apiProps.api.query.parachainStaking.candidateInfo(validator.address),
      apiProps.api.query.identity.identityOf(validator.address)
    ]);

    const rawInfo = _info.toHuman() as Record<string, any>;
    const rawIdentity = _identity.toHuman() as Record<string, any> | null;

    const bond = parseRawNumber(rawInfo?.bond as string);
    const delegationCount = parseRawNumber(rawInfo?.delegationCount as string);
    const minDelegation = parseRawNumber(rawInfo?.lowestTopDelegationAmount as string);
    const active = rawInfo?.status === 'Active';

    let isReasonable = false;
    let identity;

    if (rawIdentity !== null) {
      // Check if identity is eth address
      const _judgements = rawIdentity.judgements as any[];

      if (_judgements.length > 0) {
        isReasonable = true;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const displayName = rawIdentity?.info?.display?.Raw as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const legal = rawIdentity?.info?.legal?.Raw as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const web = rawIdentity?.info?.web?.Raw as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const riot = rawIdentity?.info?.riot?.Raw as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const email = rawIdentity?.info?.email?.Raw as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const twitter = rawIdentity?.info?.twitter?.Raw as string;

      if (displayName && !displayName.startsWith('0x')) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        identity = displayName;
      } else if (legal && !legal.startsWith('0x')) {
        identity = legal;
      } else {
        identity = twitter || web || email || riot;
      }
    }

    extraInfoMap[validator.address] = {
      identity,
      isVerified: isReasonable,
      bond: bond / 10 ** decimals,
      minDelegation: Math.max(minDelegation, chainMinDelegation) / 10 ** decimals,
      delegationCount,
      active
    } as CollatorExtraInfo;
  }));

  for (const validator of allValidators) {
    if (currentBondingValidators.includes(validator.address)) {
      validator.isNominated = true;
    }

    validator.hasScheduledRequest = existingRequestsMap[validator.address];
    validator.minBond = extraInfoMap[validator.address].minDelegation;
    validator.ownStake = extraInfoMap[validator.address].bond;
    validator.blocked = !extraInfoMap[validator.address].active;
    validator.identity = extraInfoMap[validator.address].identity;
    validator.isVerified = extraInfoMap[validator.address].isVerified;
    validator.otherStake = validator.totalStake - validator.ownStake;
    validator.nominatorCount = extraInfoMap[validator.address].delegationCount;
    validator.commission = collatorCommission;
  }

  return {
    maxNominatorPerValidator: maxDelegatorPerCandidate,
    era: -1,
    validatorsInfo: allValidators,
    isBondedBefore: rawDelegatorState !== null,
    bondedValidators,
    maxNominations: maxDelegationCount
  };
}

export async function getParaBondingTxInfo (networkJson: NetworkJson, dotSamaApi: ApiProps, delegatorAddress: string, amount: number, collatorInfo: ValidatorInfo, currentNominationCount: number) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());
  const rawDelegatorState = (await apiPromise.api.query.parachainStaking.delegatorState(delegatorAddress)).toHuman() as Record<string, any> | null;

  const bondedValidators: string[] = [];

  if (rawDelegatorState !== null) {
    const validatorList = rawDelegatorState.delegations as Record<string, any>[];

    for (const _validator of validatorList) {
      bondedValidators.push(_validator.owner as string);
    }
  }

  let extrinsic;

  if (!bondedValidators.includes(collatorInfo.address)) {
    extrinsic = apiPromise.api.tx.parachainStaking.delegate(collatorInfo.address, binaryAmount, new BN(collatorInfo.nominatorCount), new BN(currentNominationCount));
  } else {
    extrinsic = apiPromise.api.tx.parachainStaking.delegatorBondMore(collatorInfo.address, binaryAmount);
  }

  return extrinsic.paymentInfo(delegatorAddress);
}

export async function handleParaBondingTxInfo (networkJson: NetworkJson, amount: number, networkKey: string, nominatorAddress: string, validatorInfo: ValidatorInfo, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, currentNominationCount: number) {
  try {
    const [txInfo, balance] = await Promise.all([
      getParaBondingTxInfo(networkJson, dotSamaApiMap[networkKey], nominatorAddress, amount, validatorInfo, currentNominationCount),
      getFreeBalance(networkKey, nominatorAddress, dotSamaApiMap, web3ApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;
    const rawFee = parseRawNumber(txInfo.partialFee.toString());
    const binaryBalance = new BN(balance);

    const sumAmount = txInfo.partialFee.addn(amount);
    const balanceError = sumAmount.gt(binaryBalance);

    return {
      rawFee,
      fee: feeString,
      balanceError
    } as BasicTxInfo;
  } catch (e) {
    return {
      fee: `0.0000 ${networkJson.nativeToken as string}`,
      balanceError: false
    } as BasicTxInfo;
  }
}

export async function getParaUnbondingTxInfo (networkJson: NetworkJson, dotSamaApi: ApiProps, address: string, amount: number, collatorAddress: string, unstakeAll: boolean) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  let extrinsic;

  if (!unstakeAll) {
    extrinsic = apiPromise.api.tx.parachainStaking.scheduleDelegatorBondLess(collatorAddress, binaryAmount);
  } else {
    extrinsic = apiPromise.api.tx.parachainStaking.scheduleRevokeDelegation(collatorAddress);
  }

  return extrinsic.paymentInfo(address);
}

export async function handleParaUnbondingTxInfo (address: string, amount: number, networkKey: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, networkJson: NetworkJson, collatorAddress: string, unstakeAll: boolean) {
  try {
    const [txInfo, balance] = await Promise.all([
      getParaUnbondingTxInfo(networkJson, dotSamaApiMap[networkKey], address, amount, collatorAddress, unstakeAll),
      getFreeBalance(networkKey, address, dotSamaApiMap, web3ApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;
    const rawFee = parseRawNumber(txInfo.partialFee.toString());
    const binaryBalance = new BN(balance);

    const balanceError = txInfo.partialFee.gt(binaryBalance);

    return {
      rawFee,
      fee: feeString,
      balanceError
    } as BasicTxInfo;
  } catch (e) {
    return {
      fee: `0.0000 ${networkJson.nativeToken as string}`,
      balanceError: false
    } as BasicTxInfo;
  }
}

export async function getParaBondingExtrinsic (delegatorAddress: string, networkJson: NetworkJson, dotSamaApi: ApiProps, amount: number, collatorInfo: ValidatorInfo, currentNominationCount: number) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());
  const rawDelegatorState = (await apiPromise.api.query.parachainStaking.delegatorState(delegatorAddress)).toHuman() as Record<string, any> | null;

  const bondedValidators: string[] = [];

  if (rawDelegatorState !== null) {
    const validatorList = rawDelegatorState.delegations as Record<string, any>[];

    for (const _validator of validatorList) {
      bondedValidators.push(_validator.owner as string);
    }
  }

  if (!bondedValidators.includes(collatorInfo.address)) {
    return apiPromise.api.tx.parachainStaking.delegate(collatorInfo.address, binaryAmount, new BN(collatorInfo.nominatorCount), new BN(currentNominationCount));
  } else {
    return apiPromise.api.tx.parachainStaking.delegatorBondMore(collatorInfo.address, binaryAmount);
  }
}

export async function getParaUnbondingExtrinsic (dotSamaApi: ApiProps, amount: number, networkJson: NetworkJson, collatorAddress: string, unstakeAll: boolean) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  if (!unstakeAll) {
    return apiPromise.api.tx.parachainStaking.scheduleDelegatorBondLess(collatorAddress, binaryAmount);
  } else {
    return apiPromise.api.tx.parachainStaking.scheduleRevokeDelegation(collatorAddress);
  }
}

export async function getParaUnlockingInfo (dotSamaApi: ApiProps, address: string, networkKey: string) {
  const apiPromise = await dotSamaApi.isReady;
  const allRequests: Record<string, Record<string, any>> = {};
  const collatorList: string[] = [];

  const rawDelegatorState = (await apiPromise.api.query.parachainStaking.delegatorState(address)).toHuman() as Record<string, any> | null;

  if (rawDelegatorState !== null) {
    const _delegations = rawDelegatorState.delegations as Record<string, string>[];

    for (const item of _delegations) {
      collatorList.push(item.owner);
    }

    await Promise.all(collatorList.map(async (validator) => {
      const scheduledRequests = (await apiPromise.api.query.parachainStaking.delegationScheduledRequests(validator)).toHuman() as Record<string, any>[];

      scheduledRequests.forEach((request) => {
        if (reformatAddress(request.delegator as string, 0).toLowerCase() === reformatAddress(address, 0).toLowerCase()) { // need to reformat address
          const redeemRound = parseRawNumber(request.whenExecutable as string);
          let amount;
          let action;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (request.action.Revoke) {
            action = REVOKE_ACTION;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            amount = parseRawNumber(request.action.Revoke as string);
          } else {
            action = BOND_LESS_ACTION;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            amount = parseRawNumber(request.action.Decrease as string);
          }

          allRequests[redeemRound.toString()] = {
            action,
            amount,
            validator
          };
        }
      });
    }));
  }

  let nextWithdrawalAmount = 0;
  let nextWithdrawalAction = '';
  let nextWithdrawalRound = -1;
  let validatorAddress = '';

  Object.entries(allRequests).forEach(([key, data]) => {
    const round = key.split('_')[0];

    if (nextWithdrawalRound === -1) {
      nextWithdrawalRound = parseFloat(round);
      nextWithdrawalAction = data.action as string;
      nextWithdrawalAmount = data.amount as number;
      validatorAddress = data.validator as string;
    } else if (nextWithdrawalRound > parseFloat(round)) {
      nextWithdrawalRound = parseFloat(round);
      nextWithdrawalAction = data.action as string;
      nextWithdrawalAmount = data.amount as number;
      validatorAddress = data.validator as string;
    }
  });

  const currentRoundInfo = (await apiPromise.api.query.parachainStaking.round()).toHuman() as Record<string, string>;
  const currentRound = parseRawNumber(currentRoundInfo.current);
  const nextWithdrawal = (nextWithdrawalRound - currentRound) * ERA_LENGTH_MAP[networkKey];

  return {
    nextWithdrawal: nextWithdrawal > 0 ? nextWithdrawal : 0,
    redeemable: nextWithdrawal <= 0 ? nextWithdrawalAmount : 0,
    nextWithdrawalAmount,
    nextWithdrawalAction,
    validatorAddress
  };
}

export async function handleParaUnlockingInfo (dotSamaApi: ApiProps, networkJson: NetworkJson, networkKey: string, address: string) {
  if (['bifrost', 'bifrost_testnet'].includes(networkKey)) {
    return handleBifrostUnlockingInfo(dotSamaApi, networkJson, networkKey, address);
  }

  const { nextWithdrawal, nextWithdrawalAction, nextWithdrawalAmount, redeemable, validatorAddress } = await getParaUnlockingInfo(dotSamaApi, address, networkKey);

  const parsedRedeemable = redeemable / (10 ** (networkJson.decimals as number));
  const parsedNextWithdrawalAmount = nextWithdrawalAmount / (10 ** (networkJson.decimals as number));

  return {
    nextWithdrawal,
    redeemable: parsedRedeemable,
    nextWithdrawalAmount: parsedNextWithdrawalAmount,
    nextWithdrawalAction,
    validatorAddress
  } as UnlockingStakeInfo;
}

export async function getParaWithdrawalTxInfo (dotSamaApi: ApiProps, address: string, collatorAddress: string, action: string) {
  const apiPromise = await dotSamaApi.isReady;

  console.log(`executing ${action}`, address, collatorAddress);
  const extrinsic = apiPromise.api.tx.parachainStaking.executeDelegationRequest(address, collatorAddress);

  return extrinsic.paymentInfo(address);
}

export async function handleParaWithdrawalTxInfo (networkKey: string, networkJson: NetworkJson, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, address: string, collatorAddress: string, action: string) {
  try {
    const [txInfo, balance] = await Promise.all([
      getParaWithdrawalTxInfo(dotSamaApiMap[networkKey], address, collatorAddress, action),
      getFreeBalance(networkKey, address, dotSamaApiMap, web3ApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;
    const rawFee = parseRawNumber(txInfo.partialFee.toString());
    const binaryBalance = new BN(balance);
    const balanceError = txInfo.partialFee.gt(binaryBalance);

    return {
      rawFee,
      fee: feeString,
      balanceError
    } as BasicTxInfo;
  } catch (e) {
    return {
      fee: `0.0000 ${networkJson.nativeToken as string}`,
      balanceError: false
    } as BasicTxInfo;
  }
}

export async function getParaWithdrawalExtrinsic (dotSamaApi: ApiProps, address: string, collatorAddress: string, action: string) {
  const apiPromise = await dotSamaApi.isReady;

  console.log(`executing ${action}`, address, collatorAddress);

  return apiPromise.api.tx.parachainStaking.executeDelegationRequest(address, collatorAddress);
}

export async function getParaDelegationInfo (dotSamaApi: ApiProps, address: string, networkKey: string) {
  if (['bifrost', 'bifrost_testnet'].includes(networkKey)) {
    return getBifrostDelegationInfo(dotSamaApi, address);
  }

  const apiPromise = await dotSamaApi.isReady;
  const delegationsList: DelegationItem[] = [];

  const rawDelegatorState = (await apiPromise.api.query.parachainStaking.delegatorState(address)).toHuman() as Record<string, any> | null;

  if (rawDelegatorState !== null) {
    const delegationMap: Record<string, string> = {};
    const _delegations = rawDelegatorState.delegations as Record<string, string>[];

    for (const item of _delegations) {
      if (item.owner in delegationMap) {
        delegationMap[item.owner] = (parseRawNumber(item.amount) + parseRawNumber(delegationMap[item.owner])).toString();
      } else {
        delegationMap[item.owner] = parseRawNumber(item.amount).toString();
      }
    }

    await Promise.all(Object.entries(delegationMap).map(async ([owner, amount]) => {
      const [_info, _identity, _scheduledRequests] = await Promise.all([
        apiPromise.api.query.parachainStaking.candidateInfo(owner),
        apiPromise.api.query.identity.identityOf(owner),
        apiPromise.api.query.parachainStaking.delegationScheduledRequests(owner)
      ]);
      const rawScheduledRequests = _scheduledRequests.toHuman() as Record<string, any>[];
      const rawInfo = _info.toHuman() as Record<string, any>;
      const rawIdentity = _identity.toHuman() as Record<string, any> | null;
      let identity;

      const minDelegation = (rawInfo?.lowestTopDelegationAmount as string).replaceAll(',', '');

      // handle identity
      if (rawIdentity !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const displayName = rawIdentity?.info?.display?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const legal = rawIdentity?.info?.legal?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const web = rawIdentity?.info?.web?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const riot = rawIdentity?.info?.riot?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const email = rawIdentity?.info?.email?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const twitter = rawIdentity?.info?.twitter?.Raw as string;

        if (displayName && !displayName.startsWith('0x')) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          identity = displayName;
        } else if (legal && !legal.startsWith('0x')) {
          identity = legal;
        } else {
          identity = twitter || web || email || riot;
        }
      }

      // check scheduled request
      let unbondingAmount = 0;
      let hasScheduledRequest = false;

      for (const scheduledRequest of rawScheduledRequests) {
        const delegator = scheduledRequest.delegator as string;
        const formattedDelegator = reformatAddress(delegator, 0);
        const formattedAddress = reformatAddress(address, 0);

        if (formattedAddress.toLowerCase() === formattedDelegator.toLowerCase()) { // returned data might not have the same address format
          hasScheduledRequest = true;
          const action = scheduledRequest.action as Record<string, string>;

          Object.values(action).forEach((value) => {
            unbondingAmount += parseRawNumber(value);
          });
        }
      }

      const activeStake = parseRawNumber(amount) - unbondingAmount;

      delegationsList.push({
        owner,
        amount: activeStake.toString(),
        identity,
        minBond: minDelegation,
        hasScheduledRequest
      });
    }));
  }

  return delegationsList;
}

async function getBifrostDelegationInfo (dotSamaApi: ApiProps, address: string) {
  const apiPromise = await dotSamaApi.isReady;
  const delegationsList: DelegationItem[] = [];

  const rawDelegatorState = (await apiPromise.api.query.parachainStaking.delegatorState(address)).toHuman() as Record<string, any> | null;

  if (rawDelegatorState !== null) {
    const delegationMap: Record<string, string> = {};
    const _delegations = rawDelegatorState.delegations as Record<string, string>[];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const unbondingRequests = rawDelegatorState.requests.requests as Record<string, Record<string, string>>;

    for (const item of _delegations) {
      if (item.owner in delegationMap) {
        delegationMap[item.owner] = (parseRawNumber(item.amount) + parseRawNumber(delegationMap[item.owner])).toString();
      } else {
        delegationMap[item.owner] = parseRawNumber(item.amount).toString();
      }
    }

    await Promise.all(Object.entries(delegationMap).map(async ([owner, amount]) => {
      const [_info, _identity] = await Promise.all([
        apiPromise.api.query.parachainStaking.candidateInfo(owner),
        apiPromise.api.query.identity.identityOf(owner)
      ]);
      const rawInfo = _info.toHuman() as Record<string, any>;
      const rawIdentity = _identity.toHuman() as Record<string, any> | null;
      let identity;

      const minDelegation = (rawInfo?.lowestTopDelegationAmount as string).replaceAll(',', '');

      // handle identity
      if (rawIdentity !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const displayName = rawIdentity?.info?.display?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const legal = rawIdentity?.info?.legal?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const web = rawIdentity?.info?.web?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const riot = rawIdentity?.info?.riot?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const email = rawIdentity?.info?.email?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const twitter = rawIdentity?.info?.twitter?.Raw as string;

        if (displayName && !displayName.startsWith('0x')) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          identity = displayName;
        } else if (legal && !legal.startsWith('0x')) {
          identity = legal;
        } else {
          identity = twitter || web || email || riot;
        }
      }

      // check scheduled request
      let unbondingAmount = 0;
      let hasScheduledRequest = false;

      Object.values(unbondingRequests).forEach((request) => {
        const collatorAddress = request.collator;
        const formattedCollator = reformatAddress(collatorAddress, 0);
        const formattedOwner = reformatAddress(owner, 0);

        if (formattedCollator === formattedOwner) {
          hasScheduledRequest = true;
          unbondingAmount += parseRawNumber(request.amount);
        }
      });

      const activeStake = parseRawNumber(amount) - unbondingAmount;

      delegationsList.push({
        owner,
        amount: activeStake.toString(),
        identity,
        minBond: minDelegation,
        hasScheduledRequest
      });
    }));
  }

  return delegationsList;
}

function getBifrostBondedValidators (bondedCollators: string[], unbondingRequests: Record<string, Record<string, string>>) {
  const currentBondingValidators: string[] = [];
  const existingRequestsMap: Record<string, boolean> = {};

  for (const collator of bondedCollators) {
    if (collator in unbondingRequests) {
      existingRequestsMap[collator] = true;

      if (unbondingRequests[collator].action.toLowerCase() !== REVOKE_ACTION) {
        currentBondingValidators.push(collator);
      }
    } else {
      currentBondingValidators.push(collator);
    }
  }

  return {
    currentBondingValidators,
    existingRequestsMap
  };
}

async function handleBifrostUnlockingInfo (dotSamaApi: ApiProps, networkJson: NetworkJson, networkKey: string, address: string) {
  const apiPromise = await dotSamaApi.isReady;

  const rawDelegatorState = (await apiPromise.api.query.parachainStaking.delegatorState(address)).toHuman() as Record<string, any> | null;

  let nextWithdrawalAmount = -1;
  let nextWithdrawalAction = '';
  let nextWithdrawalRound = -1;
  let validatorAddress = '';

  if (rawDelegatorState !== null) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const scheduledRequests = rawDelegatorState.requests.requests as Record<string, Record<string, string>>;

    Object.values(scheduledRequests).forEach((request) => {
      const round = parseRawNumber(request.whenExecutable);

      if (nextWithdrawalRound === -1) {
        nextWithdrawalRound = round;
        nextWithdrawalAction = request.action;
        nextWithdrawalAmount = parseRawNumber(request.amount);
        validatorAddress = request.collator;
      } else if (nextWithdrawalRound > round) {
        nextWithdrawalRound = round;
        nextWithdrawalAction = request.action;
        nextWithdrawalAmount = parseRawNumber(request.amount);
        validatorAddress = request.collator;
      }
    });
  }

  const currentRoundInfo = (await apiPromise.api.query.parachainStaking.round()).toHuman() as Record<string, string>;
  const currentRound = parseRawNumber(currentRoundInfo.current);
  const nextWithdrawal = (nextWithdrawalRound - currentRound) * ERA_LENGTH_MAP[networkKey];

  const redeemable = nextWithdrawal <= 0 ? nextWithdrawalAmount : 0;
  const parsedRedeemable = redeemable / (10 ** (networkJson.decimals as number));
  const parsedNextWithdrawalAmount = nextWithdrawalAmount / (10 ** (networkJson.decimals as number));

  return {
    nextWithdrawal: nextWithdrawal > 0 ? nextWithdrawal : 0,
    redeemable: parsedRedeemable,
    nextWithdrawalAmount: parsedNextWithdrawalAmount,
    nextWithdrawalAction,
    validatorAddress
  } as UnlockingStakeInfo;
}

async function getTuringCompoundTxInfo (dotSamaApi: ApiProps, address: string, collatorAddress: string, accountMinimum: string, bondedAmount: string, networkJson: NetworkJson) {
  const apiPromise = await dotSamaApi.isReady;

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  const _optimalCompounding = await apiPromise.api.rpc.automationTime.calculateOptimalAutostaking(bondedAmount, collatorAddress);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  const optimalCompounding = _optimalCompounding.toHuman() as TuringOptimalCompoundFormat;
  const compoundingPeriod = parseInt(optimalCompounding.period); // in days

  const frequency = compoundingPeriod * 24 * 60 * 60; // in seconds
  const timestamp = new Date();

  timestamp.setDate(timestamp.getDate() + compoundingPeriod);
  timestamp.setHours(timestamp.getHours() + Math.round(timestamp.getMinutes() / 60));
  timestamp.setMinutes(0, 0, 0);

  const startTime = Math.floor(timestamp.valueOf() / 1000); // must be unix timestamp in seconds

  const extrinsic = apiPromise.api.tx.automationTime.scheduleAutoCompoundDelegatedStakeTask(startTime.toString(), frequency.toString(), collatorAddress, accountMinimum);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [paymentInfo, _compoundFee] = await Promise.all([
    extrinsic.paymentInfo(address),
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    apiPromise.api.rpc.automationTime.getTimeAutomationFees('AutoCompoundDelegatedStake', 1)
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  const bnCompoundFee = _compoundFee as BN;

  const compoundFee = parseNumberToDisplay(bnCompoundFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;

  return {
    optimalTime: optimalCompounding.period, // in days
    paymentInfo,
    initTime: compoundingPeriod,
    compoundFee,
    bnCompoundFee
  };
}

export async function handleTuringCompoundTxInfo (networkKey: string, networkJson: NetworkJson, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, address: string, collatorAddress: string, accountMinimum: string, bondedAmount: string) {
  const [txInfo, balance] = await Promise.all([
    getTuringCompoundTxInfo(dotSamaApiMap[networkKey], address, collatorAddress, accountMinimum, bondedAmount, networkJson),
    getFreeBalance(networkKey, address, dotSamaApiMap, web3ApiMap)
  ]);

  const feeString = parseNumberToDisplay(txInfo.paymentInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;
  const rawFee = parseRawNumber(txInfo.paymentInfo.toString());
  const binaryBalance = new BN(balance);
  const totalFee = txInfo.paymentInfo.partialFee.add(txInfo.bnCompoundFee);
  const rawCompoundFee = parseRawNumber(txInfo.bnCompoundFee.toString());
  const balanceError = totalFee.gt(binaryBalance);

  const basicTxInfo: BasicTxInfo = {
    rawFee,
    fee: feeString,
    balanceError
  };

  return {
    txInfo: basicTxInfo,
    optimalFrequency: txInfo.optimalTime,
    initTime: txInfo.initTime,
    compoundFee: txInfo.compoundFee,
    rawCompoundFee
  } as TuringStakeCompoundResp;
}

export async function getTuringCompoundExtrinsic (dotSamaApi: ApiProps, address: string, collatorAddress: string, accountMinimum: string, bondedAmount: string) {
  const apiPromise = await dotSamaApi.isReady;

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  const _optimalCompounding = await apiPromise.api.rpc.automationTime.calculateOptimalAutostaking(bondedAmount, collatorAddress);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  const optimalCompounding = _optimalCompounding.toHuman() as TuringOptimalCompoundFormat;
  const compoundingPeriod = parseInt(optimalCompounding.period); // in days

  const frequency = compoundingPeriod * 24 * 60 * 60; // in seconds
  const timestamp = new Date();

  timestamp.setDate(timestamp.getDate() + compoundingPeriod);
  timestamp.setHours(timestamp.getHours() + Math.round(timestamp.getMinutes() / 60));
  timestamp.setMinutes(0, 0, 0);

  const startTime = Math.floor(timestamp.valueOf() / 1000); // must be in seconds

  return apiPromise.api.tx.automationTime.scheduleAutoCompoundDelegatedStakeTask(startTime.toString(), frequency.toString(), collatorAddress, accountMinimum);
}

export async function checkTuringStakeCompoundingTask (dotSamaApi: ApiProps, address: string, collatorAddress: string) {
  const apiPromise = await dotSamaApi.isReady;

  const _allTasks = await apiPromise.api.query.automationTime.accountTasks.entries(address);
  let taskId = '';
  let accountMinimum = 0;
  let frequency = 0;

  for (const task of _allTasks) {
    const taskMetadata = task[0].toHuman() as string[];
    const taskDetail = task[1].toHuman() as Record<string, any>;

    // Only check for the AutoCompoundDelegatedStake task
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (taskDetail.action.AutoCompoundDelegatedStake && taskDetail.action.AutoCompoundDelegatedStake.collator === collatorAddress) {
      taskId = taskMetadata[1];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      accountMinimum = parseRawNumber(taskDetail?.action?.AutoCompoundDelegatedStake?.accountMinimum as string);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      frequency = parseRawNumber(taskDetail?.action?.AutoCompoundDelegatedStake?.frequency as string);

      break; // only need to check for the first task
    }
  }

  return {
    taskId,
    accountMinimum,
    frequency
  };
}

export async function handleTuringCancelCompoundTxInfo (dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, taskId: string, address: string, networkKey: string, networkJson: NetworkJson) {
  const dotSamaApi = dotSamaApiMap[networkKey];
  const apiPromise = await dotSamaApi.isReady;

  const extrinsic = apiPromise.api.tx.automationTime.cancelTask(taskId);

  const [paymentInfo, balance] = await Promise.all([
    extrinsic.paymentInfo(address),
    getFreeBalance(networkKey, address, dotSamaApiMap, web3ApiMap)
  ]);

  const feeString = parseNumberToDisplay(paymentInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;
  const rawFee = parseRawNumber(paymentInfo.partialFee.toString());
  const binaryBalance = new BN(balance);
  const balanceError = paymentInfo.partialFee.gt(binaryBalance);

  const basicTxInfo: BasicTxInfo = {
    rawFee,
    fee: feeString,
    balanceError
  };

  return basicTxInfo;
}

export async function getTuringCancelCompoundingExtrinsic (dotSamaApi: ApiProps, taskId: string) {
  const apiPromise = await dotSamaApi.isReady;

  return apiPromise.api.tx.automationTime.cancelTask(taskId);
}
