// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ChainStakingMetadata, NominationInfo, NominatorMetadata, StakingType, UnstakingInfo, UnstakingStatus, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { parseRawNumber } from '@subwallet/extension-base/utils';
import { BlockHeader, getBondedValidators, isUnstakeAll, PalletIdentityRegistration, ParachainStakingStakeOption, parseIdentity } from '@subwallet/extension-koni-base/api/staking/bonding/utils';

import { BN } from '@polkadot/util';
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

  const delegatorState = _delegatorState.toPrimitive() as unknown as ParachainStakingStakeOption;
  const unstakingInfo = _unstakingInfo.toPrimitive() as unknown as Record<string, number>;

  if (!delegatorState && !unstakingInfo) {
    return;
  }

  let activeStake = '0';

  if (delegatorState) { // delegatorState can be null while unstaking all
    const identityInfo = (await chainApi.api.query.identity.identityOf(delegatorState.owner)).toPrimitive() as unknown as PalletIdentityRegistration;
    const identity = parseIdentity(identityInfo);

    activeStake = delegatorState.amount.toString();

    nominationList.push({
      chain,
      validatorAddress: delegatorState.owner,
      activeStake: delegatorState.amount.toString(),
      validatorMinStake: '0',
      hasUnstaking: !!unstakingInfo,
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

    const isClaimable = parseInt(nearestUnstakingBlock) - currentBlockNumber <= 0;
    const remainingBlock = parseInt(nearestUnstakingBlock) - (currentBlockNumber + 1);
    const waitingTime = remainingBlock * blockDuration;

    unstakingList.push({
      chain,
      status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
      claimable: nearestUnstakingAmount.toString(),
      waitingTime: waitingTime > 0 ? waitingTime : 0,
      validatorAddress: delegatorState.owner
    });
  }

  if (nominationList.length === 0 && unstakingList.length === 0) {
    return;
  }

  return {
    chain,
    type: StakingType.NOMINATED,
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
    const collatorInfo = _collator[1].toHuman() as unknown as CollatorInfo;

    if (typeof collatorInfo.status === 'string' && collatorInfo.status.toLowerCase() === 'active') {
      allCollators.push({
        address: collatorInfo.id,
        totalStake: parseRawNumber(collatorInfo.total).toString(),
        ownStake: parseRawNumber(collatorInfo.stake).toString(),
        otherStake: (parseRawNumber(collatorInfo.total) - parseRawNumber(collatorInfo.stake)).toString(),
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
  }

  return allCollators;
}

export async function getAmplitudeBondingExtrinsic (nominatorMetadata: NominatorMetadata, substrateApi: _SubstrateApi, amount: string, selectedValidatorInfo: ValidatorInfo) {
  const chainApi = await substrateApi.isReady;
  const binaryAmount = new BN(amount);

  const { bondedValidators } = getBondedValidators(nominatorMetadata.nominations);

  if (!bondedValidators.includes(selectedValidatorInfo.address)) {
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
