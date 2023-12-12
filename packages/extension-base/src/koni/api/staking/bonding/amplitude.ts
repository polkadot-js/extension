// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ChainStakingMetadata, NominationInfo, NominatorMetadata, StakingType, UnstakingInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { BlockHeader, getBondedValidators, getStakingStatusByNominations, isUnstakeAll, ParachainStakingStakeOption, parseIdentity } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { EarningStatus, UnstakingStatus } from '@subwallet/extension-base/types';
import { parseRawNumber, reformatAddress } from '@subwallet/extension-base/utils';

import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

interface InflationConfig {
  collator: {
    maxRate: string,
    rewardRate: {
      annual: string,
      perBlock: string
    }
  },
  delegator: {
    maxRate: string,
    rewardRate: {
      annual: string,
      perBlock: string
    }
  }
}

interface CollatorInfo {
  id: string,
  stake: string,
  delegators: any[],
  total: string,
  status: string | Record<string, string>
}

export function subscribeAmplitudeStakingMetadata (chain: string, substrateApi: _SubstrateApi, callback: (chain: string, rs: ChainStakingMetadata) => void) {
  return substrateApi.api.query.parachainStaking.round((_round: Codec) => {
    const roundObj = _round.toHuman() as Record<string, string>;
    const round = parseRawNumber(roundObj.current);
    const maxDelegations = substrateApi.api.consts.parachainStaking.maxDelegationsPerRound.toString();
    const minDelegatorStake = substrateApi.api.consts.parachainStaking.minDelegatorStake.toString();
    const unstakingDelay = substrateApi.api.consts.parachainStaking.stakeDuration.toString();
    const _blockPerRound = substrateApi.api.consts.parachainStaking.defaultBlocksPerRound.toString();
    const blockPerRound = parseFloat(_blockPerRound);

    const blockDuration = (_STAKING_ERA_LENGTH_MAP[chain] || _STAKING_ERA_LENGTH_MAP.default) / blockPerRound; // in hours
    const unstakingPeriod = blockDuration * parseInt(unstakingDelay);

    callback(chain, {
      chain,
      type: StakingType.NOMINATED,
      era: round,
      minStake: minDelegatorStake,
      maxValidatorPerNominator: parseInt(maxDelegations),
      maxWithdrawalRequestPerValidator: 1, // by default
      allowCancelUnstaking: true,
      unstakingPeriod
    });
  });
}

export async function getAmplitudeStakingMetadata (chain: string, substrateApi: _SubstrateApi): Promise<ChainStakingMetadata> {
  const chainApi = await substrateApi.isReady;

  const _round = (await chainApi.api.query.parachainStaking.round()).toHuman() as Record<string, string>;
  const round = parseRawNumber(_round.current);
  const maxDelegations = chainApi.api.consts.parachainStaking.maxDelegationsPerRound.toString();
  const minDelegatorStake = chainApi.api.consts.parachainStaking.minDelegatorStake.toString();
  const unstakingDelay = chainApi.api.consts.parachainStaking.stakeDuration.toString();
  const _blockPerRound = chainApi.api.consts.parachainStaking.defaultBlocksPerRound.toString();
  const blockPerRound = parseFloat(_blockPerRound);

  const blockDuration = (_STAKING_ERA_LENGTH_MAP[chain] || _STAKING_ERA_LENGTH_MAP.default) / blockPerRound; // in hours
  const unstakingPeriod = blockDuration * parseInt(unstakingDelay);

  return {
    chain,
    type: StakingType.NOMINATED,
    era: round,
    minStake: minDelegatorStake,
    maxValidatorPerNominator: parseInt(maxDelegations),
    maxWithdrawalRequestPerValidator: 1, // by default
    allowCancelUnstaking: true,
    unstakingPeriod
  } as ChainStakingMetadata;
}

export async function subscribeAmplitudeNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi, delegatorState: ParachainStakingStakeOption, unstakingInfo: Record<string, number>) {
  const nominationList: NominationInfo[] = [];
  const unstakingList: UnstakingInfo[] = [];
  const minDelegatorStake = substrateApi.api.consts.parachainStaking.minDelegatorStake.toString();

  let activeStake = '0';

  if (delegatorState) { // delegatorState can be null while unstaking all
    const [identity] = await parseIdentity(substrateApi, delegatorState.owner);

    activeStake = delegatorState.amount.toString();
    const bnActiveStake = new BN(activeStake);
    let delegationStatus: EarningStatus = EarningStatus.NOT_EARNING;

    if (bnActiveStake.gt(BN_ZERO) && bnActiveStake.gte(new BN(minDelegatorStake))) {
      delegationStatus = EarningStatus.EARNING_REWARD;
    }

    nominationList.push({
      status: delegationStatus,
      chain: chainInfo.slug,
      validatorAddress: delegatorState.owner,
      activeStake: delegatorState.amount.toString(),
      validatorMinStake: '0',
      hasUnstaking: !!unstakingInfo && Object.values(unstakingInfo).length > 0,
      validatorIdentity: identity
    });
  }

  if (unstakingInfo && Object.values(unstakingInfo).length > 0) {
    const _currentBlockInfo = await substrateApi.api.rpc.chain.getHeader();

    const currentBlockInfo = _currentBlockInfo.toPrimitive() as unknown as BlockHeader;
    const currentBlockNumber = currentBlockInfo.number;

    const _blockPerRound = substrateApi.api.consts.parachainStaking.defaultBlocksPerRound.toString();
    const blockPerRound = parseFloat(_blockPerRound);

    const nearestUnstakingBlock = Object.keys(unstakingInfo)[0];
    const nearestUnstakingAmount = Object.values(unstakingInfo)[0];

    const blockDuration = (_STAKING_ERA_LENGTH_MAP[chainInfo.slug] || _STAKING_ERA_LENGTH_MAP.default) / blockPerRound; // in hours

    const isClaimable = parseInt(nearestUnstakingBlock) - currentBlockNumber < 0;
    const remainingBlock = parseInt(nearestUnstakingBlock) - currentBlockNumber;
    const waitingTime = remainingBlock * blockDuration;

    unstakingList.push({
      chain: chainInfo.slug,
      status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
      claimable: nearestUnstakingAmount.toString(),
      waitingTime,
      validatorAddress: delegatorState?.owner || undefined
    });
  }

  const stakingStatus = getStakingStatusByNominations(new BN(activeStake), nominationList);

  return {
    chain: chainInfo.slug,
    type: StakingType.NOMINATED,
    status: stakingStatus,
    address: address,
    activeStake: activeStake,
    nominations: nominationList,
    unstakings: unstakingList
  } as NominatorMetadata;
}

/**
 * Deprecated
 * */
export async function getAmplitudeNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi): Promise<NominatorMetadata | undefined> {
  if (isEthereumAddress(address)) {
    return;
  }

  const chain = chainInfo.slug;
  const chainApi = await substrateApi.isReady;

  const nominationList: NominationInfo[] = [];
  const unstakingList: UnstakingInfo[] = [];

  const [_delegatorState, _unstakingInfo] = await Promise.all([
    chainApi.api.query.parachainStaking.delegatorState(address),
    chainApi.api.query.parachainStaking.unstaking(address)
  ]);

  const minDelegatorStake = chainApi.api.consts.parachainStaking.minDelegatorStake.toString();
  const delegatorState = _delegatorState.toPrimitive() as unknown as ParachainStakingStakeOption;
  const unstakingInfo = _unstakingInfo.toPrimitive() as unknown as Record<string, number>;

  if (!delegatorState && !unstakingInfo) {
    return {
      chain: chainInfo.slug,
      type: StakingType.NOMINATED,
      address,
      status: EarningStatus.NOT_STAKING,
      activeStake: '0',
      nominations: [],
      unstakings: []
    } as NominatorMetadata;
  }

  let activeStake = '0';

  if (delegatorState) { // delegatorState can be null while unstaking all
    const [identity] = await parseIdentity(substrateApi, delegatorState.owner);

    activeStake = delegatorState.amount.toString();
    const bnActiveStake = new BN(activeStake);
    let delegationStatus: EarningStatus = EarningStatus.NOT_EARNING;

    if (bnActiveStake.gt(BN_ZERO) && bnActiveStake.gte(new BN(minDelegatorStake))) {
      delegationStatus = EarningStatus.EARNING_REWARD;
    }

    nominationList.push({
      status: delegationStatus,
      chain,
      validatorAddress: delegatorState.owner,
      activeStake: delegatorState.amount.toString(),
      validatorMinStake: '0',
      hasUnstaking: !!unstakingInfo && Object.values(unstakingInfo).length > 0,
      validatorIdentity: identity
    });
  }

  if (unstakingInfo && Object.values(unstakingInfo).length > 0) {
    const _currentBlockInfo = await chainApi.api.rpc.chain.getHeader();

    const currentBlockInfo = _currentBlockInfo.toPrimitive() as unknown as BlockHeader;
    const currentBlockNumber = currentBlockInfo.number;

    const _blockPerRound = chainApi.api.consts.parachainStaking.defaultBlocksPerRound.toString();
    const blockPerRound = parseFloat(_blockPerRound);

    const nearestUnstakingBlock = Object.keys(unstakingInfo)[0];
    const nearestUnstakingAmount = Object.values(unstakingInfo)[0];

    const blockDuration = (_STAKING_ERA_LENGTH_MAP[chain] || _STAKING_ERA_LENGTH_MAP.default) / blockPerRound; // in hours

    const isClaimable = parseInt(nearestUnstakingBlock) - currentBlockNumber < 0;
    const remainingBlock = parseInt(nearestUnstakingBlock) - currentBlockNumber;
    const waitingTime = remainingBlock * blockDuration;

    unstakingList.push({
      chain,
      status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
      claimable: nearestUnstakingAmount.toString(),
      waitingTime,
      validatorAddress: delegatorState?.owner || undefined
    });
  }

  if (nominationList.length === 0 && unstakingList.length === 0) {
    return;
  }

  const stakingStatus = getStakingStatusByNominations(new BN(activeStake), nominationList);

  return {
    chain,
    type: StakingType.NOMINATED,
    status: stakingStatus,
    address: address,
    activeStake: activeStake,
    nominations: nominationList,
    unstakings: unstakingList
  } as NominatorMetadata;
}

export async function getAmplitudeCollatorsInfo (chain: string, substrateApi: _SubstrateApi): Promise<ValidatorInfo[]> {
  const chainApi = await substrateApi.isReady;

  const [_allCollators, _inflationConfig] = await Promise.all([
    chainApi.api.query.parachainStaking.candidatePool.entries(),
    chainApi.api.query.parachainStaking.inflationConfig()
  ]);

  const maxDelegatorsPerCollator = chainApi.api.consts.parachainStaking.maxDelegatorsPerCollator.toString();
  const inflationConfig = _inflationConfig.toHuman() as unknown as InflationConfig;
  const rawDelegatorReturn = inflationConfig.delegator.rewardRate.annual;
  const delegatorReturn = parseFloat(rawDelegatorReturn.split('%')[0]);

  const allCollators: ValidatorInfo[] = [];

  for (const _collator of _allCollators) {
    const collatorInfo = _collator[1].toPrimitive() as unknown as CollatorInfo;

    const bnTotalStake = new BN(collatorInfo.total);
    const bnOwnStake = new BN(collatorInfo.stake);
    const bnOtherStake = bnTotalStake.sub(bnOwnStake);

    allCollators.push({
      address: collatorInfo.id,
      totalStake: bnTotalStake.toString(),
      ownStake: bnOwnStake.toString(),
      otherStake: bnOtherStake.toString(),
      nominatorCount: collatorInfo.delegators.length,
      commission: 0,
      expectedReturn: delegatorReturn,
      blocked: false,
      isVerified: false,
      minBond: '0',
      chain,
      isCrowded: collatorInfo.delegators.length >= parseInt(maxDelegatorsPerCollator)
    });
  }

  return allCollators;
}

export async function getAmplitudeBondingExtrinsic (substrateApi: _SubstrateApi, amount: string, selectedValidatorInfo: ValidatorInfo, nominatorMetadata?: NominatorMetadata) {
  const chainApi = await substrateApi.isReady;
  const binaryAmount = new BN(amount);

  if (!nominatorMetadata) {
    return chainApi.api.tx.parachainStaking.joinDelegators(selectedValidatorInfo.address, binaryAmount);
  }

  const { bondedValidators } = getBondedValidators(nominatorMetadata.nominations);

  if (!bondedValidators.includes(reformatAddress(selectedValidatorInfo.address, 0))) {
    return chainApi.api.tx.parachainStaking.joinDelegators(selectedValidatorInfo.address, binaryAmount);
  } else {
    const _params = chainApi.api.tx.parachainStaking.delegatorStakeMore.toJSON() as Record<string, any>;
    const paramsCount = (_params.args as any[]).length;

    if (paramsCount === 2) { // detect number of params
      return chainApi.api.tx.parachainStaking.delegatorStakeMore(selectedValidatorInfo.address, binaryAmount);
    } else {
      return chainApi.api.tx.parachainStaking.delegatorStakeMore(binaryAmount);
    }
  }
}

export async function getAmplitudeUnbondingExtrinsic (substrateApi: _SubstrateApi, amount: string, nominatorMetadata: NominatorMetadata, collatorAddress: string) {
  const chainApi = await substrateApi.isReady;
  const binaryAmount = new BN(amount);

  const unstakeAll = isUnstakeAll(collatorAddress, nominatorMetadata.nominations, amount);

  if (!unstakeAll) {
    const _params = chainApi.api.tx.parachainStaking.delegatorStakeMore.toJSON() as Record<string, any>;
    const paramsCount = (_params.args as any[]).length;

    if (paramsCount === 2) {
      return chainApi.api.tx.parachainStaking.delegatorStakeLess(collatorAddress, binaryAmount);
    } else {
      return chainApi.api.tx.parachainStaking.delegatorStakeLess(binaryAmount);
    }
  } else {
    return chainApi.api.tx.parachainStaking.leaveDelegators();
  }
}

export async function getAmplitudeWithdrawalExtrinsic (substrateApi: _SubstrateApi, address: string) {
  const chainApi = await substrateApi.isReady;

  return chainApi.api.tx.parachainStaking.unlockUnstaked(address);
}

export async function getAmplitudeClaimRewardExtrinsic (substrateApi: _SubstrateApi) {
  const chainApi = await substrateApi.isReady;

  return chainApi.api.tx.utility.batch([
    chainApi.api.tx.parachainStaking.incrementDelegatorRewards(),
    chainApi.api.tx.parachainStaking.claimRewards()
  ]);
}
