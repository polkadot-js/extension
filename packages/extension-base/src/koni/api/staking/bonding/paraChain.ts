// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ChainStakingMetadata, NominationInfo, NominatorMetadata, StakingStatus, StakingTxErrorType, StakingType, UnstakingInfo, UnstakingStatus, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getBondedValidators, getExistUnstakeErrorMessage, getMaxValidatorErrorMessage, getMinStakeErrorMessage, getParaCurrentInflation, getStakingStatusByNominations, InflationConfig, isUnstakeAll, PalletIdentityRegistration, PalletParachainStakingDelegationRequestsScheduledRequest, PalletParachainStakingDelegator, ParachainStakingCandidateMetadata, parseIdentity, TuringOptimalCompoundFormat } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { isSameAddress, parseRawNumber, reformatAddress } from '@subwallet/extension-base/utils';

import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

interface CollatorExtraInfo {
  active: boolean,
  identity?: string,
  isVerified: boolean,
}

export function validateParaChainUnbondingCondition (amount: string, nominatorMetadata: NominatorMetadata, chainStakingMetadata: ChainStakingMetadata, selectedCollator: string): TransactionError[] {
  const errors: TransactionError[] = [];
  let targetNomination: NominationInfo | undefined;

  for (const nomination of nominatorMetadata.nominations) {
    if (isSameAddress(nomination.validatorAddress, selectedCollator)) {
      targetNomination = nomination;

      break;
    }
  }

  if (!targetNomination) {
    errors.push(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));

    return errors;
  }

  const bnActiveStake = new BN(targetNomination.activeStake);
  const bnRemainingStake = bnActiveStake.sub(new BN(amount));

  const bnChainMinStake = new BN(chainStakingMetadata.minStake || '0');
  const bnCollatorMinStake = new BN(targetNomination.validatorMinStake || '0');
  const bnMinStake = BN.max(bnCollatorMinStake, bnChainMinStake);
  const existUnstakeErrorMessage = getExistUnstakeErrorMessage(chainStakingMetadata.chain);

  if (targetNomination.hasUnstaking) {
    errors.push(new TransactionError(StakingTxErrorType.EXIST_UNSTAKING_REQUEST, existUnstakeErrorMessage));
  }

  if (!(bnRemainingStake.isZero() || bnRemainingStake.gte(bnMinStake))) {
    errors.push(new TransactionError(StakingTxErrorType.INVALID_ACTIVE_STAKE));
  }

  return errors;
}

export function validateParaChainBondingCondition (chainInfo: _ChainInfo, amount: string, selectedCollators: ValidatorInfo[], address: string, chainStakingMetadata: ChainStakingMetadata, nominatorMetadata?: NominatorMetadata): TransactionError[] {
  const errors: TransactionError[] = [];
  const selectedCollator = selectedCollators[0];
  let bnTotalStake = new BN(amount);
  const bnChainMinStake = new BN(chainStakingMetadata.minStake || '0');
  const bnCollatorMinStake = new BN(selectedCollator.minBond || '0');
  const bnMinStake = bnCollatorMinStake > bnChainMinStake ? bnCollatorMinStake : bnChainMinStake;
  const minStakeErrorMessage = getMinStakeErrorMessage(chainInfo, bnMinStake);
  const maxValidatorErrorMessage = getMaxValidatorErrorMessage(chainInfo, chainStakingMetadata.maxValidatorPerNominator);
  const existUnstakeErrorMessage = getExistUnstakeErrorMessage(chainInfo.slug, true);

  if (!nominatorMetadata || nominatorMetadata.status === StakingStatus.NOT_STAKING) {
    if (!bnTotalStake.gte(bnMinStake)) {
      errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
    }

    return errors;
  }

  const { bondedValidators } = getBondedValidators(nominatorMetadata.nominations);
  const parsedSelectedCollatorAddress = reformatAddress(selectedCollator.address, 0);

  if (!bondedValidators.includes(parsedSelectedCollatorAddress)) { // new delegation
    if (!bnTotalStake.gte(bnMinStake)) {
      errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
    }

    const delegationCount = nominatorMetadata.nominations.length + 1;

    if (delegationCount > chainStakingMetadata.maxValidatorPerNominator) {
      errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_NOMINATIONS, maxValidatorErrorMessage));
    }
  } else {
    let currentDelegationAmount = '0';
    let hasUnstaking = false;

    for (const delegation of nominatorMetadata.nominations) {
      if (reformatAddress(delegation.validatorAddress, 0) === parsedSelectedCollatorAddress) {
        currentDelegationAmount = delegation.activeStake;
        hasUnstaking = !!delegation.hasUnstaking && delegation.hasUnstaking;

        break;
      }
    }

    bnTotalStake = bnTotalStake.add(new BN(currentDelegationAmount));

    if (!bnTotalStake.gte(bnMinStake)) {
      errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
    }

    if (hasUnstaking) {
      errors.push(new TransactionError(StakingTxErrorType.EXIST_UNSTAKING_REQUEST, existUnstakeErrorMessage));
    }
  }

  return errors;
}

export function subscribeParaChainStakingMetadata (chain: string, substrateApi: _SubstrateApi, callback: (chain: string, rs: ChainStakingMetadata) => void) {
  return substrateApi.api.query.parachainStaking.round((_round: Codec) => {
    const roundObj = _round.toHuman() as Record<string, string>;
    const round = parseRawNumber(roundObj.current);
    const maxDelegations = substrateApi.api.consts?.parachainStaking?.maxDelegationsPerDelegator?.toString();
    const unstakingDelay = substrateApi.api.consts.parachainStaking.delegationBondLessDelay.toString();
    const unstakingPeriod = parseInt(unstakingDelay) * (_STAKING_ERA_LENGTH_MAP[chain] || _STAKING_ERA_LENGTH_MAP.default);

    callback(chain, {
      chain,
      type: StakingType.NOMINATED,
      era: round,
      minStake: '0',
      maxValidatorPerNominator: parseInt(maxDelegations),
      maxWithdrawalRequestPerValidator: 1, // by default
      allowCancelUnstaking: true,
      unstakingPeriod
    });
  });
}

export async function getParaChainStakingMetadata (chain: string, substrateApi: _SubstrateApi): Promise<ChainStakingMetadata> {
  const chainApi = await substrateApi.isReady;

  const _round = (await chainApi.api.query.parachainStaking.round()).toHuman() as Record<string, string>;
  const round = parseRawNumber(_round.current);
  const maxDelegations = chainApi.api.consts.parachainStaking.maxDelegationsPerDelegator.toString();
  const unstakingDelay = chainApi.api.consts.parachainStaking.delegationBondLessDelay.toString();

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
  const unstakingPeriod = parseInt(unstakingDelay) * _STAKING_ERA_LENGTH_MAP[chain];

  return {
    chain,
    type: StakingType.NOMINATED,
    era: round,
    inflation,
    minStake: '0',
    maxValidatorPerNominator: parseInt(maxDelegations),
    maxWithdrawalRequestPerValidator: 1, // by default
    allowCancelUnstaking: true,
    unstakingPeriod
  } as ChainStakingMetadata;
}

export async function subscribeParaChainNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi, delegatorState: PalletParachainStakingDelegator) {
  const nominationList: NominationInfo[] = [];
  const unstakingMap: Record<string, UnstakingInfo> = {};

  let bnTotalActiveStake = BN_ZERO;

  const _roundInfo = await substrateApi.api.query.parachainStaking.round();
  const roundInfo = _roundInfo.toPrimitive() as Record<string, number>;
  const currentRound = roundInfo.current;

  await Promise.all(delegatorState.delegations.map(async (delegation) => {
    const [_delegationScheduledRequests, _identity, _collatorInfo] = await Promise.all([
      substrateApi.api.query.parachainStaking.delegationScheduledRequests(delegation.owner),
      substrateApi.api.query.identity?.identityOf(delegation.owner),
      substrateApi.api.query.parachainStaking.candidateInfo(delegation.owner)
    ]);

    const collatorInfo = _collatorInfo.toPrimitive() as unknown as ParachainStakingCandidateMetadata;
    const minDelegation = collatorInfo?.lowestTopDelegationAmount.toString();
    const identityInfo = _identity?.toHuman() as unknown as PalletIdentityRegistration;
    const delegationScheduledRequests = _delegationScheduledRequests.toPrimitive() as unknown as PalletParachainStakingDelegationRequestsScheduledRequest[];

    const identity = parseIdentity(identityInfo);
    let hasUnstaking = false;
    let delegationStatus: StakingStatus = StakingStatus.NOT_EARNING;

    // parse unstaking info
    if (delegationScheduledRequests) {
      for (const scheduledRequest of delegationScheduledRequests) {
        if (reformatAddress(scheduledRequest.delegator, 0) === reformatAddress(address, 0)) { // add network prefix
          const isClaimable = scheduledRequest.whenExecutable - currentRound < 0;
          const remainingEra = scheduledRequest.whenExecutable - currentRound;
          const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chainInfo.slug];
          const claimable = Object.values(scheduledRequest.action)[0];

          unstakingMap[delegation.owner] = {
            chain: chainInfo.slug,
            status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
            validatorAddress: delegation.owner,
            claimable: claimable.toString(),
            waitingTime
          } as UnstakingInfo;

          hasUnstaking = true;
          break; // only handle 1 scheduledRequest per collator
        }
      }
    }

    const bnStake = new BN(delegation.amount);
    const bnUnstakeBalance = unstakingMap[delegation.owner] ? new BN(unstakingMap[delegation.owner].claimable) : BN_ZERO;

    const bnActiveStake = bnStake.sub(bnUnstakeBalance);

    if (bnActiveStake.gt(BN_ZERO) && bnActiveStake.gte(new BN(minDelegation))) {
      delegationStatus = StakingStatus.EARNING_REWARD;
    }

    bnTotalActiveStake = bnTotalActiveStake.add(bnActiveStake);

    nominationList.push({
      chain: chainInfo.slug,
      status: delegationStatus,
      validatorAddress: delegation.owner,
      validatorIdentity: identity,
      activeStake: bnActiveStake.toString(),
      hasUnstaking,
      validatorMinStake: collatorInfo.lowestTopDelegationAmount.toString()
    });
  }));

  // await Promise.all(nominationList.map(async (nomination) => {
  //   const _collatorInfo = await substrateApi.api.query.parachainStaking.candidateInfo(nomination.validatorAddress);
  //   const collatorInfo = _collatorInfo.toPrimitive() as unknown as ParachainStakingCandidateMetadata;
  //
  //   nomination.validatorMinStake = collatorInfo.lowestTopDelegationAmount.toString();
  // }));

  const stakingStatus = getStakingStatusByNominations(bnTotalActiveStake, nominationList);

  return {
    chain: chainInfo.slug,
    type: StakingType.NOMINATED,
    status: stakingStatus,
    address: address,
    activeStake: bnTotalActiveStake.toString(),

    nominations: nominationList,
    unstakings: Object.values(unstakingMap)
  } as NominatorMetadata;
}

export async function getParaChainNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi): Promise<NominatorMetadata | undefined> {
  if (_isChainEvmCompatible(chainInfo) && !isEthereumAddress(address)) {
    return;
  }

  const chain = chainInfo.slug;
  const chainApi = await substrateApi.isReady;

  const nominationList: NominationInfo[] = [];
  const unstakingMap: Record<string, UnstakingInfo> = {};

  const _delegatorState = await chainApi.api.query.parachainStaking.delegatorState(address);
  const delegatorState = _delegatorState.toPrimitive() as unknown as PalletParachainStakingDelegator;

  if (!delegatorState) {
    return {
      chain: chainInfo.slug,
      type: StakingType.NOMINATED,
      address,
      status: StakingStatus.NOT_STAKING,
      activeStake: '0',
      nominations: [],
      unstakings: []
    } as NominatorMetadata;
  }

  let bnTotalActiveStake = BN_ZERO;

  await Promise.all(delegatorState.delegations.map(async (delegation) => {
    const [_delegationScheduledRequests, _identity, _roundInfo, _collatorInfo] = await Promise.all([
      chainApi.api.query.parachainStaking.delegationScheduledRequests(delegation.owner),
      chainApi.api.query.identity.identityOf(delegation.owner),
      chainApi.api.query.parachainStaking.round(),
      chainApi.api.query.parachainStaking.candidateInfo(delegation.owner)
    ]);

    const rawCollatorInfo = _collatorInfo.toHuman() as Record<string, any>;
    const minDelegation = (rawCollatorInfo?.lowestTopDelegationAmount as string).replaceAll(',', '');
    const identityInfo = _identity.toHuman() as unknown as PalletIdentityRegistration;
    const roundInfo = _roundInfo.toPrimitive() as Record<string, number>;
    const delegationScheduledRequests = _delegationScheduledRequests.toPrimitive() as unknown as PalletParachainStakingDelegationRequestsScheduledRequest[];

    const currentRound = roundInfo.current;
    const identity = parseIdentity(identityInfo);
    let hasUnstaking = false;
    let delegationStatus: StakingStatus = StakingStatus.NOT_EARNING;

    // parse unstaking info
    if (delegationScheduledRequests) {
      for (const scheduledRequest of delegationScheduledRequests) {
        if (reformatAddress(scheduledRequest.delegator, 0) === reformatAddress(address, 0)) { // add network prefix
          const isClaimable = scheduledRequest.whenExecutable - currentRound < 0;
          const remainingEra = scheduledRequest.whenExecutable - (currentRound + 1);
          const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chain];
          const claimable = Object.values(scheduledRequest.action)[0];

          unstakingMap[delegation.owner] = {
            chain,
            status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
            validatorAddress: delegation.owner,
            claimable: claimable.toString(),
            waitingTime: waitingTime
          } as UnstakingInfo;

          hasUnstaking = true;
          break; // only handle 1 scheduledRequest per collator
        }
      }
    }

    const bnStake = new BN(delegation.amount);
    const bnUnstakeBalance = unstakingMap[delegation.owner] ? new BN(unstakingMap[delegation.owner].claimable) : BN_ZERO;

    const bnActiveStake = bnStake.sub(bnUnstakeBalance);

    if (bnActiveStake.gt(BN_ZERO) && bnActiveStake.gte(new BN(minDelegation))) {
      delegationStatus = StakingStatus.EARNING_REWARD;
    }

    bnTotalActiveStake = bnTotalActiveStake.add(bnActiveStake);

    nominationList.push({
      chain,
      status: delegationStatus,
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

  const stakingStatus = getStakingStatusByNominations(bnTotalActiveStake, nominationList);

  return {
    chain,
    type: StakingType.NOMINATED,
    status: stakingStatus,
    address: address,
    activeStake: bnTotalActiveStake.toString(),

    nominations: nominationList,
    unstakings: Object.values(unstakingMap)
  } as NominatorMetadata;
}

export async function getParachainCollatorsInfo (chain: string, substrateApi: _SubstrateApi): Promise<ValidatorInfo[]> {
  const apiProps = await substrateApi.isReady;

  const allCollators: ValidatorInfo[] = [];

  const [_allCollators, _collatorCommission] = await Promise.all([
    apiProps.api.query.parachainStaking.candidateInfo.entries(),
    apiProps.api.query.parachainStaking.collatorCommission()
  ]);

  const maxDelegationPerCollator = apiProps.api.consts.parachainStaking.maxTopDelegationsPerCandidate.toString();
  const rawCollatorCommission = _collatorCommission.toHuman() as string;
  const collatorCommission = parseFloat(rawCollatorCommission.split('%')[0]);

  for (const collator of _allCollators) {
    const _collatorAddress = collator[0].toHuman() as string[];
    const collatorAddress = _collatorAddress[0];
    const collatorInfo = collator[1].toPrimitive() as unknown as ParachainStakingCandidateMetadata;

    const bnTotalStake = new BN(collatorInfo.totalCounted);
    const bnOwnStake = new BN(collatorInfo.bond);
    const bnOtherStake = bnTotalStake.sub(bnOwnStake);
    const bnMinBond = new BN(collatorInfo.lowestTopDelegationAmount);

    allCollators.push({
      commission: 0,
      expectedReturn: 0,
      address: collatorAddress,
      totalStake: bnTotalStake.toString(),
      ownStake: bnOwnStake.toString(),
      otherStake: bnOtherStake.toString(),
      nominatorCount: collatorInfo.delegationCount,
      blocked: false,
      isVerified: false,
      minBond: bnMinBond.toString(),
      chain,
      isCrowded: parseInt(maxDelegationPerCollator) > 0
    });
  }

  const extraInfoMap: Record<string, CollatorExtraInfo> = {};

  await Promise.all(allCollators.map(async (collator) => {
    const [_info, _identity] = await Promise.all([
      apiProps.api.query.parachainStaking.candidateInfo(collator.address),
      apiProps.api.query?.identity?.identityOf(collator.address) // some chains might not have identity pallet
    ]);

    const rawInfo = _info.toHuman() as Record<string, any>;
    const rawIdentity = _identity ? _identity.toHuman() as unknown as PalletIdentityRegistration : null;

    const active = rawInfo?.status === 'Active';

    let isReasonable = false;
    let identity;

    if (rawIdentity !== null) {
      // Check if identity is eth address
      isReasonable = rawIdentity.judgements.length > 0;
      identity = parseIdentity(rawIdentity);
    }

    extraInfoMap[collator.address] = {
      identity,
      isVerified: isReasonable,
      active
    } as CollatorExtraInfo;
  }));

  for (const validator of allCollators) {
    validator.blocked = !extraInfoMap[validator.address].active;
    validator.identity = extraInfoMap[validator.address].identity;
    validator.isVerified = extraInfoMap[validator.address].isVerified;
    // @ts-ignore
    validator.commission = collatorCommission;
  }

  return allCollators;
}

export async function getParaBondingExtrinsic (chainInfo: _ChainInfo, substrateApi: _SubstrateApi, amount: string, selectedCollatorInfo: ValidatorInfo, nominatorMetadata?: NominatorMetadata) {
  const apiPromise = await substrateApi.isReady;
  const binaryAmount = new BN(amount);

  if (!nominatorMetadata) {
    return apiPromise.api.tx.parachainStaking.delegate(selectedCollatorInfo.address, binaryAmount, new BN(selectedCollatorInfo.nominatorCount), 0);
  }

  const { bondedValidators, nominationCount } = getBondedValidators(nominatorMetadata.nominations);
  const parsedSelectedCollatorAddress = reformatAddress(selectedCollatorInfo.address, 0);

  if (!bondedValidators.includes(parsedSelectedCollatorAddress)) {
    return apiPromise.api.tx.parachainStaking.delegate(selectedCollatorInfo.address, binaryAmount, new BN(selectedCollatorInfo.nominatorCount), nominationCount);
  } else {
    return apiPromise.api.tx.parachainStaking.delegatorBondMore(selectedCollatorInfo.address, binaryAmount);
  }
}

export async function getParaUnbondingExtrinsic (substrateApi: _SubstrateApi, amount: string, nominatorMetadata: NominatorMetadata, selectedValidator: string) {
  const apiPromise = await substrateApi.isReady;
  const binaryAmount = new BN(amount);

  const unstakeAll = isUnstakeAll(selectedValidator, nominatorMetadata.nominations, amount);

  if (!unstakeAll) {
    return apiPromise.api.tx.parachainStaking.scheduleDelegatorBondLess(selectedValidator, binaryAmount);
  } else {
    return apiPromise.api.tx.parachainStaking.scheduleRevokeDelegation(selectedValidator);
  }
}

export async function getParaWithdrawalExtrinsic (substrateApi: _SubstrateApi, address: string, collatorAddress: string) {
  const chainApi = await substrateApi.isReady;

  return chainApi.api.tx.parachainStaking.executeDelegationRequest(address, collatorAddress);
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

export async function getTuringCancelCompoundingExtrinsic (substrateApi: _SubstrateApi, taskId: string) {
  const apiPromise = await substrateApi.isReady;

  return apiPromise.api.tx.automationTime.cancelTask(taskId);
}

export async function getParaCancelWithdrawalExtrinsic (substrateApi: _SubstrateApi, selectedUnstaking: UnstakingInfo) {
  const chainApi = await substrateApi.isReady;

  return chainApi.api.tx.parachainStaking.cancelDelegationRequest(selectedUnstaking.validatorAddress);
}
