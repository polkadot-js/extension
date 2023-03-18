// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ChainStakingMetadata, NominationInfo, NominatorMetadata, StakingType, UnstakingInfo, UnstakingStatus, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { parseRawNumber, reformatAddress } from '@subwallet/extension-base/utils';
import { getBondedValidators, getParaCurrentInflation, InflationConfig, isUnstakeAll, PalletIdentityRegistration, PalletParachainStakingDelegationRequestsScheduledRequest, PalletParachainStakingDelegator, ParachainStakingCandidateMetadata, parseIdentity, TuringOptimalCompoundFormat } from '@subwallet/extension-koni-base/api/staking/bonding/utils';

import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

interface CollatorExtraInfo {
  active: boolean,
  identity?: string,
  isVerified: boolean,
  delegationCount: number,
  bond: string,
  minDelegation: string
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

export async function getParachainCollatorsInfo (chain: string, substrateApi: _SubstrateApi): Promise<ValidatorInfo[]> {
  const apiProps = await substrateApi.isReady;

  const allValidators: ValidatorInfo[] = [];

  const [_allCollators, _collatorCommission] = await Promise.all([
    apiProps.api.query.parachainStaking.candidateInfo.entries(),
    apiProps.api.query.parachainStaking.collatorCommission()
  ]);

  const maxDelegationPerCollator = apiProps.api.consts.parachainStaking.maxTopDelegationsPerCandidate.toString();
  const rawCollatorCommission = _collatorCommission.toHuman() as string;
  const collatorCommission = parseFloat(rawCollatorCommission.split('%')[0]);

  for (const collator of _allCollators) {
    const collatorAddress = collator[0].toPrimitive() as string;
    const collatorInfo = collator[1].toPrimitive() as unknown as ParachainStakingCandidateMetadata;

    allValidators.push({
      commission: 0,
      expectedReturn: 0,
      address: collatorAddress,
      totalStake: collatorInfo.totalCounted.toString(),
      ownStake: collatorInfo.bond.toString(),
      otherStake: (collatorInfo.totalCounted - collatorInfo.bond).toString(),
      nominatorCount: collatorInfo.delegationCount,
      blocked: false,
      isVerified: false,
      minBond: collatorInfo.lowestTopDelegationAmount.toString(),
      chain,
      isCrowded: parseInt(maxDelegationPerCollator) > 0
    });
  }

  const extraInfoMap: Record<string, CollatorExtraInfo> = {};

  await Promise.all(allValidators.map(async (validator) => {
    const [_info, _identity] = await Promise.all([
      apiProps.api.query.parachainStaking.candidateInfo(validator.address),
      apiProps.api.query?.identity?.identityOf(validator.address) // some chains might not have identity pallet
    ]);

    const rawInfo = _info.toHuman() as Record<string, any>;
    const rawIdentity = _identity ? _identity.toHuman() as unknown as PalletIdentityRegistration : null;

    const rawBond = rawInfo?.bond as string;
    const bond = new BN(rawBond.replaceAll(',', ''));
    const delegationCount = parseRawNumber(rawInfo?.delegationCount as string);
    const minDelegation = parseRawNumber(rawInfo?.lowestTopDelegationAmount as string);
    const active = rawInfo?.status === 'Active';

    let isReasonable = false;
    let identity;

    if (rawIdentity !== null) {
      // Check if identity is eth address
      isReasonable = rawIdentity.judgements.length > 0;
      identity = parseIdentity(rawIdentity);
    }

    extraInfoMap[validator.address] = {
      identity,
      isVerified: isReasonable,
      bond: bond.toString(),
      minDelegation: minDelegation.toString(),
      delegationCount,
      active
    } as CollatorExtraInfo;
  }));

  for (const validator of allValidators) {
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

  return allValidators;
}

export async function getParaBondingExtrinsic (nominatorMetadata: NominatorMetadata, chainInfo: _ChainInfo, substrateApi: _SubstrateApi, amount: string, selectedCollatorInfo: ValidatorInfo) {
  const apiPromise = await substrateApi.isReady;
  const binaryAmount = new BN(amount);

  const { bondedValidators, nominationCount } = getBondedValidators(nominatorMetadata.nominations);

  if (!bondedValidators.includes(reformatAddress(selectedCollatorInfo.address, 0))) {
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
