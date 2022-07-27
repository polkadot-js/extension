// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, BasicTxInfo, ChainBondingBasics, DelegationItem, NetworkJson, UnlockingStakeInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { BOND_LESS_ACTION, calculateChainStakedReturn, ERA_LENGTH_MAP, PARACHAIN_INFLATION_DISTRIBUTION, REVOKE_ACTION } from '@subwallet/extension-koni-base/api/bonding/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { parseNumberToDisplay, parseRawNumber, reformatAddress } from '@subwallet/extension-koni-base/utils/utils';
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

  const [_totalStake, _totalIssuance, _inflation] = await Promise.all([
    apiProps.api.query.parachainStaking.total(),
    apiProps.api.query.balances.totalIssuance(),
    apiProps.api.query.parachainStaking.inflationConfig()
  ]);

  const totalStake = _totalStake.toHuman() as string;
  const parsedTotalStake = parseFloat(totalStake.replaceAll(',', ''));

  const totalIssuance = _totalIssuance.toHuman() as string;
  const parsedTotalIssuance = parseFloat(totalIssuance.replaceAll(',', ''));

  const inflation = _inflation.toHuman() as Record<string, Record<string, any>>;
  const inflationString = inflation.annual.ideal as string;
  const parsedInflation = parseFloat(inflationString.split('%')[0]);
  const rewardPool = parsedInflation * PARACHAIN_INFLATION_DISTRIBUTION[networkKey].reward;

  const stakedReturn = calculateChainStakedReturn(rewardPool, parsedTotalStake, parsedTotalIssuance, networkKey);

  return {
    isMaxNominators: false,
    stakedReturn
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
  const [txInfo, balance] = await Promise.all([
    getParaBondingTxInfo(networkJson, dotSamaApiMap[networkKey], nominatorAddress, amount, validatorInfo, currentNominationCount),
    getFreeBalance(networkKey, nominatorAddress, dotSamaApiMap, web3ApiMap)
  ]);

  const feeString = parseNumberToDisplay(txInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;
  const binaryBalance = new BN(balance);

  const sumAmount = txInfo.partialFee.addn(amount);
  const balanceError = sumAmount.gt(binaryBalance);

  return {
    fee: feeString,
    balanceError
  } as BasicTxInfo;
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
  const [txInfo, balance] = await Promise.all([
    getParaUnbondingTxInfo(networkJson, dotSamaApiMap[networkKey], address, amount, collatorAddress, unstakeAll),
    getFreeBalance(networkKey, address, dotSamaApiMap, web3ApiMap)
  ]);

  const feeString = parseNumberToDisplay(txInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;
  const binaryBalance = new BN(balance);

  const balanceError = txInfo.partialFee.gt(binaryBalance);

  return {
    fee: feeString,
    balanceError
  } as BasicTxInfo;
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
  const [txInfo, balance] = await Promise.all([
    getParaWithdrawalTxInfo(dotSamaApiMap[networkKey], address, collatorAddress, action),
    getFreeBalance(networkKey, address, dotSamaApiMap, web3ApiMap)
  ]);

  const feeString = parseNumberToDisplay(txInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;
  const binaryBalance = new BN(balance);
  const balanceError = txInfo.partialFee.gt(binaryBalance);

  return {
    fee: feeString,
    balanceError
  } as BasicTxInfo;
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
