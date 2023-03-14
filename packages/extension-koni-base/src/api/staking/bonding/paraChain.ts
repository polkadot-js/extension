// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { BasicTxInfo, ChainStakingMetadata, DelegationItem, NominationInfo, NominatorMetadata, StakingType, TuringStakeCompoundResp, UnlockingStakeInfo, UnstakingInfo, UnstakingStatus, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_CHAIN_GROUP, _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { parseNumberToDisplay, parseRawNumber, reformatAddress } from '@subwallet/extension-base/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { BOND_LESS_ACTION, getParaCurrentInflation, InflationConfig, PalletIdentityRegistration, PalletParachainStakingDelegationRequestsScheduledRequest, PalletParachainStakingDelegator, ParachainStakingCandidateMetadata, parseIdentity, REVOKE_ACTION, TuringOptimalCompoundFormat } from '@subwallet/extension-koni-base/api/staking/bonding/utils';

import { BN, BN_ZERO } from '@polkadot/util';

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

export async function getParaChainStakingMetadata (chain: string, substrateApi: _SubstrateApi): Promise<ChainStakingMetadata> {
  const chainApi = await substrateApi.isReady;

  const _round = (await chainApi.api.query.parachainStaking.round()).toHuman() as Record<string, string>;
  const round = parseRawNumber(_round.current);
  const maxDelegations = chainApi.api.consts.parachainStaking.maxDelegationsPerDelegator.toString();

  let _unvestedAllocation;

  if (chainApi.api.query.vesting && chainApi.api.query.vesting.totalUnvestedAllocation) {
    _unvestedAllocation = await chainApi.api.query.vesting.totalUnvestedAllocation();
  }

  const [_totalStake, _totalIssuance, _inflation] = await Promise.all([
    chainApi.api.query.parachainStaking.staked(round),
    chainApi.api.query.balances.totalIssuance(),
    chainApi.api.query.parachainStaking.inflationConfig()
  ]);

  let unvestedAllocation;

  if (_unvestedAllocation) {
    const rawUnvestedAllocation = _unvestedAllocation.toString();

    unvestedAllocation = new BN(rawUnvestedAllocation);
  }

  const totalStake = _totalStake ? new BN(_totalStake.toString()) : BN_ZERO;
  const totalIssuance = new BN(_totalIssuance.toString());

  if (unvestedAllocation) {
    totalIssuance.add(unvestedAllocation); // for Turing network, read more at https://hackmd.io/@sbAqOuXkRvyiZPOB3Ryn6Q/Sypr3ZJh5
  }

  const inflationConfig = _inflation.toHuman() as unknown as InflationConfig;
  const inflation = getParaCurrentInflation(parseRawNumber(totalStake.toString()), inflationConfig);

  return {
    chain,
    type: StakingType.NOMINATED,
    era: round,
    inflation,
    minStake: '0',
    maxValidatorPerNominator: parseInt(maxDelegations),
    maxWithdrawalRequestPerValidator: 1, // by default
    allowCancelUnstaking: true
  } as ChainStakingMetadata;
}

export async function getParaChainNominatorMetadata (chain: string, address: string, substrateApi: _SubstrateApi): Promise<NominatorMetadata | undefined> {
  const chainApi = await substrateApi.isReady;

  const nominationList: NominationInfo[] = [];
  const unstakingMap: Record<string, UnstakingInfo> = {};

  const _delegatorState = await chainApi.api.query.parachainStaking.delegatorState(address);

  const delegatorState = _delegatorState.toPrimitive() as unknown as PalletParachainStakingDelegator;

  if (!delegatorState) {
    return;
  }

  let bnTotalActiveStake = BN_ZERO;

  await Promise.all(delegatorState.delegations.map(async (delegation) => {
    const [_delegationScheduledRequests, _identity, _roundInfo] = await Promise.all([
      chainApi.api.query.parachainStaking.delegationScheduledRequests(delegation.owner),
      chainApi.api.query.identity.identityOf(delegation.owner),
      chainApi.api.query.parachainStaking.round()
    ]);

    const identityInfo = _identity.toHuman() as unknown as PalletIdentityRegistration;
    const roundInfo = _roundInfo.toPrimitive() as Record<string, number>;
    const delegationScheduledRequests = _delegationScheduledRequests.toPrimitive() as unknown as PalletParachainStakingDelegationRequestsScheduledRequest[];

    const currentRound = roundInfo.current;
    const identity = parseIdentity(identityInfo);
    let hasUnstaking = false;

    // parse unstaking info
    if (delegationScheduledRequests) {
      for (const scheduledRequest of delegationScheduledRequests) {
        if (reformatAddress(scheduledRequest.delegator, 0) === reformatAddress(address, 0)) { // add network prefix
          const isClaimable = scheduledRequest.whenExecutable - currentRound <= 0;
          const remainingEra = scheduledRequest.whenExecutable - (currentRound + 1);
          const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chain];
          const claimable = Object.values(scheduledRequest.action)[0];

          unstakingMap[delegation.owner] = {
            chain,
            status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
            validatorAddress: delegation.owner,
            claimable: claimable.toString(),
            waitingTime: waitingTime > 0 ? waitingTime : 0
          } as UnstakingInfo;

          hasUnstaking = true;
          break; // only handle 1 scheduledRequest per collator
        }
      }
    }

    const bnStake = new BN(delegation.amount);
    const bnUnstakeBalance = unstakingMap[delegation.owner] ? new BN(unstakingMap[delegation.owner].claimable) : BN_ZERO;

    const bnActiveStake = bnStake.sub(bnUnstakeBalance);

    bnTotalActiveStake = bnTotalActiveStake.add(bnActiveStake);

    nominationList.push({
      chain,
      validatorAddress: delegation.owner,
      validatorIdentity: identity,
      activeStake: bnActiveStake.toString(),
      hasUnstaking
    });
  }));

  await Promise.all(nominationList.map(async (nomination) => {
    const _collatorInfo = await chainApi.api.query.parachainStaking.candidateInfo(nomination.validatorAddress);
    const collatorInfo = _collatorInfo.toPrimitive() as unknown as ParachainStakingCandidateMetadata;

    nomination.validatorMinStake = collatorInfo.lowestTopDelegationAmount.toString();
  }));

  return {
    chain,
    type: StakingType.NOMINATED,
    address: address,
    activeStake: bnTotalActiveStake.toString(),

    nominations: nominationList,
    unstakings: Object.values(unstakingMap)
  } as NominatorMetadata;
}

export async function getParaCollatorsInfo (networkKey: string, substrateApi: _SubstrateApi, decimals: number, address: string) {
  const apiProps = await substrateApi.isReady;

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
      totalStake: (parseRawNumber(collator.amount) / 10 ** decimals).toString(),
      ownStake: '0',
      otherStake: '0',
      nominatorCount: 0,
      blocked: false,
      isVerified: false,
      minBond: '0',
      isNominated: false,
      chain: networkKey
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
      apiProps.api.query?.identity?.identityOf(validator.address) // some chains might not have identity pallet
    ]);

    const rawInfo = _info.toHuman() as Record<string, any>;
    const rawIdentity = _identity ? _identity.toHuman() as Record<string, any> | null : null;

    const bnDecimals = new BN((10 ** decimals).toString());
    const rawBond = rawInfo?.bond as string;
    const bond = new BN(rawBond.replaceAll(',', ''));
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
      bond: bond.div(bnDecimals).toNumber(),
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
    validator.minBond = extraInfoMap[validator.address].minDelegation.toString();
    validator.ownStake = extraInfoMap[validator.address].bond.toString();
    validator.blocked = !extraInfoMap[validator.address].active;
    validator.identity = extraInfoMap[validator.address].identity;
    validator.isVerified = extraInfoMap[validator.address].isVerified;
    // @ts-ignore
    validator.otherStake = (validator.totalStake - validator.ownStake).toString();
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

export async function getParaBondingTxInfo (chainInfo: _ChainInfo, substrateApi: _SubstrateApi, delegatorAddress: string, amount: number, collatorInfo: ValidatorInfo, currentNominationCount: number) {
  const apiPromise = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = amount * (10 ** decimals);
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

export async function handleParaBondingTxInfo (chainInfo: _ChainInfo, amount: number, networkKey: string, nominatorAddress: string, validatorInfo: ValidatorInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, currentNominationCount: number) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const [txInfo, balance] = await Promise.all([
      getParaBondingTxInfo(chainInfo, substrateApiMap[networkKey], nominatorAddress, amount, validatorInfo, currentNominationCount),
      getFreeBalance(networkKey, nominatorAddress, substrateApiMap, evmApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, decimals) + ` ${symbol}`;
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
      fee: `0.0000 ${symbol}`,
      balanceError: false
    } as BasicTxInfo;
  }
}

export async function getParaUnbondingTxInfo (chainInfo: _ChainInfo, substrateApi: _SubstrateApi, address: string, amount: number, collatorAddress: string, unstakeAll: boolean) {
  const apiPromise = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = amount * (10 ** decimals);
  const binaryAmount = new BN(parsedAmount.toString());

  let extrinsic;

  if (!unstakeAll) {
    extrinsic = apiPromise.api.tx.parachainStaking.scheduleDelegatorBondLess(collatorAddress, binaryAmount);
  } else {
    extrinsic = apiPromise.api.tx.parachainStaking.scheduleRevokeDelegation(collatorAddress);
  }

  return extrinsic.paymentInfo(address);
}

export async function handleParaUnbondingTxInfo (address: string, amount: number, networkKey: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, chainInfo: _ChainInfo, collatorAddress: string, unstakeAll: boolean) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const [txInfo, balance] = await Promise.all([
      getParaUnbondingTxInfo(chainInfo, substrateApiMap[networkKey], address, amount, collatorAddress, unstakeAll),
      getFreeBalance(networkKey, address, substrateApiMap, evmApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, decimals) + ` ${symbol}`;
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
      fee: `0.0000 ${symbol}`,
      balanceError: false
    } as BasicTxInfo;
  }
}

export async function getParaBondingExtrinsic (delegatorAddress: string, chainInfo: _ChainInfo, substrateApi: _SubstrateApi, amount: number, collatorInfo: ValidatorInfo, currentNominationCount: number) {
  const apiPromise = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = amount * (10 ** decimals);
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

export async function getParaUnbondingExtrinsic (substrateApi: _SubstrateApi, amount: number, chainInfo: _ChainInfo, collatorAddress: string, unstakeAll: boolean) {
  const apiPromise = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = amount * (10 ** decimals);
  const binaryAmount = new BN(parsedAmount.toString());

  if (!unstakeAll) {
    return apiPromise.api.tx.parachainStaking.scheduleDelegatorBondLess(collatorAddress, binaryAmount);
  } else {
    return apiPromise.api.tx.parachainStaking.scheduleRevokeDelegation(collatorAddress);
  }
}

async function getParaUnlockingInfo (substrateApi: _SubstrateApi, address: string, networkKey: string) {
  const chainApi = await substrateApi.isReady;
  const allRequests: Record<string, Record<string, any>> = {};
  const collatorList: string[] = [];

  const rawDelegatorState = (await chainApi.api.query.parachainStaking.delegatorState(address)).toHuman() as Record<string, any> | null;

  if (rawDelegatorState !== null) {
    const _delegations = rawDelegatorState.delegations as Record<string, string>[];

    for (const item of _delegations) {
      collatorList.push(item.owner);
    }

    await Promise.all(collatorList.map(async (validator) => {
      const scheduledRequests = (await chainApi.api.query.parachainStaking.delegationScheduledRequests(validator)).toHuman() as Record<string, any>[];

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

  const currentRoundInfo = (await chainApi.api.query.parachainStaking.round()).toHuman() as Record<string, string>;
  const currentRound = parseRawNumber(currentRoundInfo.current);
  const nextWithdrawal = (nextWithdrawalRound - currentRound) * (_STAKING_ERA_LENGTH_MAP[networkKey] || _STAKING_ERA_LENGTH_MAP.default);

  return {
    nextWithdrawal: nextWithdrawal > 0 ? nextWithdrawal : 0,
    redeemable: nextWithdrawal <= 0 ? nextWithdrawalAmount : 0,
    nextWithdrawalAmount,
    nextWithdrawalAction,
    validatorAddress
  };
}

export async function handleParaUnlockingInfo (substrateApi: _SubstrateApi, chainInfo: _ChainInfo, networkKey: string, address: string, type: StakingType) {
  if (_STAKING_CHAIN_GROUP.bifrost.includes(networkKey)) {
    return handleBifrostUnlockingInfo(substrateApi, chainInfo, networkKey, address);
  }

  const { nextWithdrawal, nextWithdrawalAction, nextWithdrawalAmount, redeemable, validatorAddress } = await getParaUnlockingInfo(substrateApi, address, networkKey);
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);

  const parsedRedeemable = redeemable / (10 ** decimals);
  const parsedNextWithdrawalAmount = nextWithdrawalAmount / (10 ** decimals);

  return {
    address,
    chain: networkKey,
    type,

    nextWithdrawal,
    redeemable: parsedRedeemable,
    nextWithdrawalAmount: parsedNextWithdrawalAmount,
    nextWithdrawalAction,
    validatorAddress
  } as UnlockingStakeInfo;
}

export async function getParaWithdrawalTxInfo (substrateApi: _SubstrateApi, address: string, collatorAddress: string, action: string) {
  const apiPromise = await substrateApi.isReady;

  console.log(`executing ${action}`, address, collatorAddress);
  const extrinsic = apiPromise.api.tx.parachainStaking.executeDelegationRequest(address, collatorAddress);

  return extrinsic.paymentInfo(address);
}

export async function handleParaWithdrawalTxInfo (networkKey: string, chainInfo: _ChainInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, address: string, collatorAddress: string, action: string) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const [txInfo, balance] = await Promise.all([
      getParaWithdrawalTxInfo(substrateApiMap[networkKey], address, collatorAddress, action),
      getFreeBalance(networkKey, address, substrateApiMap, evmApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, decimals) + ` ${symbol}`;
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
      fee: `0.0000 ${symbol}`,
      balanceError: false
    } as BasicTxInfo;
  }
}

export async function getParaWithdrawalExtrinsic (substrateApi: _SubstrateApi, address: string, collatorAddress: string, action: string) {
  const apiPromise = await substrateApi.isReady;

  console.log(`executing ${action}`, address, collatorAddress);

  return apiPromise.api.tx.parachainStaking.executeDelegationRequest(address, collatorAddress);
}

export async function getParaDelegationInfo (substrateApi: _SubstrateApi, address: string, networkKey: string) {
  if (_STAKING_CHAIN_GROUP.bifrost.includes(networkKey)) {
    return getBifrostDelegationInfo(substrateApi, address);
  }

  const apiPromise = await substrateApi.isReady;
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
        apiPromise.api.query?.identity?.identityOf(owner),
        apiPromise.api.query.parachainStaking.delegationScheduledRequests(owner)
      ]);
      const rawScheduledRequests = _scheduledRequests.toHuman() as Record<string, any>[];
      const rawInfo = _info.toHuman() as Record<string, any>;
      const rawIdentity = _identity ? _identity.toHuman() as Record<string, any> | null : null;
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

async function getBifrostDelegationInfo (substrateApi: _SubstrateApi, address: string) {
  const apiPromise = await substrateApi.isReady;
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
        apiPromise.api.query?.identity?.identityOf(owner)
      ]);
      const rawInfo = _info.toHuman() as Record<string, any>;
      const rawIdentity = _identity ? _identity.toHuman() as Record<string, any> | null : null;
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

async function handleBifrostUnlockingInfo (substrateApi: _SubstrateApi, chainInfo: _ChainInfo, networkKey: string, address: string) {
  const api = await substrateApi.isReady;

  const rawDelegatorState = (await api.api.query.parachainStaking.delegatorState(address)).toHuman() as Record<string, any> | null;

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

  const currentRoundInfo = (await api.api.query.parachainStaking.round()).toHuman() as Record<string, string>;
  const currentRound = parseRawNumber(currentRoundInfo.current);
  const nextWithdrawal = (nextWithdrawalRound - currentRound) * _STAKING_ERA_LENGTH_MAP[networkKey];

  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);

  const redeemable = nextWithdrawal <= 0 ? nextWithdrawalAmount : 0;
  const parsedRedeemable = redeemable / (10 ** decimals);
  const parsedNextWithdrawalAmount = nextWithdrawalAmount / (10 ** decimals);

  return {
    nextWithdrawal: nextWithdrawal > 0 ? nextWithdrawal : 0,
    redeemable: parsedRedeemable,
    nextWithdrawalAmount: parsedNextWithdrawalAmount,
    nextWithdrawalAction,
    validatorAddress
  } as UnlockingStakeInfo;
}

async function getTuringCompoundTxInfo (substrateApi: _SubstrateApi, address: string, collatorAddress: string, accountMinimum: string, bondedAmount: string, chainInfo: _ChainInfo) {
  const apiPromise = await substrateApi.isReady;

  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

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

  const compoundFee = parseNumberToDisplay(bnCompoundFee, decimals) + ` ${symbol}`;

  return {
    optimalTime: optimalCompounding.period, // in days
    paymentInfo,
    initTime: compoundingPeriod,
    compoundFee,
    bnCompoundFee
  };
}

export async function handleTuringCompoundTxInfo (networkKey: string, chainInfo: _ChainInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, address: string, collatorAddress: string, accountMinimum: string, bondedAmount: string) {
  const [txInfo, balance] = await Promise.all([
    getTuringCompoundTxInfo(substrateApiMap[networkKey], address, collatorAddress, accountMinimum, bondedAmount, chainInfo),
    getFreeBalance(networkKey, address, substrateApiMap, evmApiMap)
  ]);

  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  const feeString = parseNumberToDisplay(txInfo.paymentInfo.partialFee, decimals) + ` ${symbol}`;
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

export async function getTuringCompoundExtrinsic (substrateApi: _SubstrateApi, address: string, collatorAddress: string, accountMinimum: string, bondedAmount: string) {
  const apiPromise = await substrateApi.isReady;

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

export async function checkTuringStakeCompoundingTask (substrateApi: _SubstrateApi, address: string, collatorAddress: string) {
  const apiPromise = await substrateApi.isReady;

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

export async function handleTuringCancelCompoundTxInfo (substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, taskId: string, address: string, networkKey: string, chainInfo: _ChainInfo) {
  const substrateApi = substrateApiMap[networkKey];
  const apiPromise = await substrateApi.isReady;

  const extrinsic = apiPromise.api.tx.automationTime.cancelTask(taskId);

  const [paymentInfo, balance] = await Promise.all([
    extrinsic.paymentInfo(address),
    getFreeBalance(networkKey, address, substrateApiMap, evmApiMap)
  ]);

  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  const feeString = parseNumberToDisplay(paymentInfo.partialFee, decimals) + ` ${symbol}`;
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

export async function getTuringCancelCompoundingExtrinsic (substrateApi: _SubstrateApi, taskId: string) {
  const apiPromise = await substrateApi.isReady;

  return apiPromise.api.tx.automationTime.cancelTask(taskId);
}
