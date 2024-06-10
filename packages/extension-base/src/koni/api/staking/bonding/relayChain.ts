// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { ChainStakingMetadata, NominationInfo, NominatorMetadata, StakingTxErrorType, StakingType, UnstakingInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { MAX_NOMINATIONS } from '@subwallet/extension-base/constants';
import { PalletNominationPoolsPoolMember } from '@subwallet/extension-base/core/substrate/nominationpools-pallet';
import { calculateAlephZeroValidatorReturn, calculateChainStakedReturn, calculateInflation, calculateTernoaValidatorReturn, calculateValidatorStakedReturn, getCommission, getExistUnstakeErrorMessage, getMaxValidatorErrorMessage, getMinStakeErrorMessage, parsePoolStashAddress } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _EXPECTED_BLOCK_TIME, _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainSubstrateAddressPrefix } from '@subwallet/extension-base/services/chain-service/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { parseIdentity } from '@subwallet/extension-base/services/earning-service/utils';
import { EarningStatus, NominationPoolInfo, PalletNominationPoolsBondedPoolInner, PalletStakingExposure, TernoaStakingRewardsStakingRewardsData, UnstakingStatus, ValidatorExtraInfo } from '@subwallet/extension-base/types';
import { reformatAddress } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';
import { t } from 'i18next';

import { Bytes } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO, hexToString, isHex } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

export interface PalletStakingNominations {
  targets: string[],
  submittedIn: number,
  suppressed: boolean
}

export interface UnlockingChunk {
  value: number,
  era: number
}

export interface PalletStakingStakingLedger {
  stash: string,
  total: number,
  active: number,
  unlocking: UnlockingChunk[],
  claimedRewards: number[]
}

export function validateRelayUnbondingCondition (amount: string, chainStakingMetadata: ChainStakingMetadata, nominatorMetadata: NominatorMetadata): TransactionError[] {
  const errors: TransactionError[] = [];
  const bnActiveStake = new BN(nominatorMetadata.activeStake);
  const bnRemainingStake = bnActiveStake.sub(new BN(amount));

  const minStake = new BN(chainStakingMetadata.minJoinNominationPool || '0');

  if (!(bnRemainingStake.isZero() || bnRemainingStake.gte(minStake))) {
    errors.push(new TransactionError(StakingTxErrorType.INVALID_ACTIVE_STAKE));
  }

  if (nominatorMetadata.unstakings.length > chainStakingMetadata.maxWithdrawalRequestPerValidator) {
    errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_UNSTAKING, t('You cannot unstake more than {{number}} times', { replace: { number: chainStakingMetadata.maxWithdrawalRequestPerValidator } })));
  }

  return errors;
}

export function validatePoolBondingCondition (chainInfo: _ChainInfo, amount: string, selectedPool: NominationPoolInfo, address: string, chainStakingMetadata: ChainStakingMetadata, nominatorMetadata?: NominatorMetadata): TransactionError[] {
  // cannot stake when unstake all
  // amount >= min stake
  const errors: TransactionError[] = [];
  let bnTotalStake = new BN(amount);
  const bnMinStake = new BN(chainStakingMetadata.minJoinNominationPool || '0');
  const minStakeErrorMessage = getMinStakeErrorMessage(chainInfo, bnMinStake);
  const existUnstakeErrorMessage = getExistUnstakeErrorMessage(chainInfo.slug, nominatorMetadata?.type, true);

  if (selectedPool.state !== 'Open') {
    errors.push(new TransactionError(StakingTxErrorType.INACTIVE_NOMINATION_POOL));
  }

  if (nominatorMetadata) {
    const bnCurrentActiveStake = new BN(nominatorMetadata.activeStake);

    bnTotalStake = bnTotalStake.add(bnCurrentActiveStake);

    if (nominatorMetadata.unstakings.length > 0 && bnCurrentActiveStake.isZero()) {
      errors.push(new TransactionError(StakingTxErrorType.EXIST_UNSTAKING_REQUEST, existUnstakeErrorMessage));
    }
  }

  if (!bnTotalStake.gte(bnMinStake)) {
    errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
  }

  return errors;
}

export function validateRelayBondingCondition (chainInfo: _ChainInfo, amount: string, selectedValidators: ValidatorInfo[], address: string, chainStakingMetadata: ChainStakingMetadata, nominatorMetadata?: NominatorMetadata) {
  const errors: TransactionError[] = [];
  let bnTotalStake = new BN(amount);
  const bnMinStake = new BN(chainStakingMetadata.minStake);
  const minStakeErrorMessage = getMinStakeErrorMessage(chainInfo, bnMinStake);
  const maxValidatorErrorMessage = getMaxValidatorErrorMessage(chainInfo, chainStakingMetadata.maxValidatorPerNominator);

  if (!nominatorMetadata || nominatorMetadata.status === EarningStatus.NOT_STAKING) {
    if (!bnTotalStake.gte(bnMinStake)) {
      errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
    }

    if (selectedValidators.length > chainStakingMetadata.maxValidatorPerNominator) {
      errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_NOMINATIONS, maxValidatorErrorMessage));
    }

    return errors;
  }

  const bnCurrentActiveStake = new BN(nominatorMetadata.activeStake);

  bnTotalStake = bnTotalStake.add(bnCurrentActiveStake);

  if (!bnTotalStake.gte(bnMinStake)) {
    errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
  }

  if (selectedValidators.length > chainStakingMetadata.maxValidatorPerNominator) {
    errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_NOMINATIONS, maxValidatorErrorMessage));
  }

  return errors;
}

export function subscribeRelayChainStakingMetadata (chainInfo: _ChainInfo, substrateApi: _SubstrateApi, callback: (chain: string, rs: ChainStakingMetadata) => void) {
  return substrateApi.api.query.staking.currentEra(async (_currentEra: Codec) => {
    const currentEra = _currentEra.toString();
    const maxNominations = substrateApi.api.consts.staking?.maxNominations?.toString() || MAX_NOMINATIONS; // TODO
    const maxUnlockingChunks = substrateApi.api.consts.staking.maxUnlockingChunks.toString();
    const unlockingEras = substrateApi.api.consts.staking.bondingDuration.toString();

    const [_totalEraStake, _totalIssuance, _auctionCounter, _minNominatorBond, _minPoolJoin, _minimumActiveStake] = await Promise.all([
      substrateApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
      substrateApi.api.query.balances.totalIssuance(),
      substrateApi.api.query.auctions?.auctionCounter(),
      substrateApi.api.query.staking.minNominatorBond(),
      substrateApi.api.query?.nominationPools?.minJoinBond(),
      substrateApi.api.query?.staking?.minimumActiveStake && substrateApi.api.query?.staking?.minimumActiveStake()
    ]);

    const minActiveStake = _minimumActiveStake?.toString() || '0';
    const minNominatorBond = _minNominatorBond.toString();

    const bnMinActiveStake = new BN(minActiveStake);
    const bnMinNominatorBond = new BN(minNominatorBond);

    const minStake = bnMinActiveStake.gt(bnMinNominatorBond) ? bnMinActiveStake : bnMinNominatorBond;
    const rawTotalEraStake = _totalEraStake.toString();
    const rawTotalIssuance = _totalIssuance.toString();

    const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;
    const bnTotalEraStake = new BN(rawTotalEraStake);
    const bnTotalIssuance = new BN(rawTotalIssuance);

    const inflation = calculateInflation(bnTotalEraStake, bnTotalIssuance, numAuctions, chainInfo.slug);
    const expectedReturn = calculateChainStakedReturn(inflation, bnTotalEraStake, bnTotalIssuance, chainInfo.slug);
    const minPoolJoin = _minPoolJoin?.toString() || undefined;
    const unlockingPeriod = parseInt(unlockingEras) * (_STAKING_ERA_LENGTH_MAP[chainInfo.slug] || _STAKING_ERA_LENGTH_MAP.default); // in hours

    callback(chainInfo.slug, {
      chain: chainInfo.slug,
      type: StakingType.NOMINATED,
      expectedReturn: !_STAKING_CHAIN_GROUP.ternoa.includes(chainInfo.slug) ? expectedReturn : undefined, // in %, annually
      inflation,
      era: parseInt(currentEra),
      minStake: minStake.toString(),
      maxValidatorPerNominator: parseInt(maxNominations),
      maxWithdrawalRequestPerValidator: parseInt(maxUnlockingChunks),
      allowCancelUnstaking: true,
      unstakingPeriod: unlockingPeriod,
      minJoinNominationPool: minPoolJoin
    });
  });
}

export async function getRelayChainStakingMetadata (chainInfo: _ChainInfo, substrateApi: _SubstrateApi): Promise<ChainStakingMetadata> {
  const chain = chainInfo.slug;
  const chainApi = await substrateApi.isReady;
  const _era = await chainApi.api.query.staking.currentEra();
  const currentEra = _era.toString();
  const maxNominations = chainApi.api.consts.staking?.maxNominations?.toString() || '16'; // TODO
  const maxUnlockingChunks = chainApi.api.consts.staking.maxUnlockingChunks.toString();
  const unlockingEras = chainApi.api.consts.staking.bondingDuration.toString();

  const [_totalEraStake, _totalIssuance, _auctionCounter, _minimumActiveStake, _minNominatorBond, _minPoolJoin, _eraStakers] = await Promise.all([
    chainApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
    chainApi.api.query.balances.totalIssuance(),
    chainApi.api.query.auctions?.auctionCounter(),
    chainApi.api.query?.staking?.minimumActiveStake && chainApi.api.query?.staking?.minimumActiveStake(),
    chainApi.api.query.staking.minNominatorBond(),
    chainApi.api.query?.nominationPools?.minJoinBond(),
    chainApi.api.query.staking.erasStakers.entries(parseInt(currentEra))
  ]);

  const eraStakers = _eraStakers as any[];
  let allCurrentNominators: Record<string, unknown>[] = [];
  const nominatorList: string[] = [];

  for (const item of eraStakers) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const rawValidatorStat = item[1].toHuman() as Record<string, any>;
    const eraNominators = rawValidatorStat.others as Record<string, any>[];

    allCurrentNominators = allCurrentNominators.concat(eraNominators);
  }

  for (const nominator of allCurrentNominators) {
    if (!nominatorList.includes(nominator.who as string)) {
      nominatorList.push(nominator.who as string);
    }
  }

  const minActiveStake = _minimumActiveStake?.toString() || '0';
  const minNominatorBond = _minNominatorBond.toString();

  const bnMinActiveStake = new BN(minActiveStake);
  const bnMinNominatorBond = new BN(minNominatorBond);

  const minStake = bnMinActiveStake.gt(bnMinNominatorBond) ? bnMinActiveStake : bnMinNominatorBond;

  const minPoolJoin = _minPoolJoin?.toString() || undefined;
  const rawTotalEraStake = _totalEraStake.toString();
  const rawTotalIssuance = _totalIssuance.toString();

  const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;

  const bnTotalEraStake = new BN(rawTotalEraStake);
  const bnTotalIssuance = new BN(rawTotalIssuance);

  const inflation = calculateInflation(bnTotalEraStake, bnTotalIssuance, numAuctions, chain);
  const expectedReturn = calculateChainStakedReturn(inflation, bnTotalEraStake, bnTotalIssuance, chain);
  const unlockingPeriod = parseInt(unlockingEras) * _STAKING_ERA_LENGTH_MAP[chain]; // in hours

  return {
    chain,
    type: StakingType.NOMINATED,
    era: parseInt(currentEra),
    expectedReturn: !_STAKING_CHAIN_GROUP.ternoa.includes(chain) ? expectedReturn : undefined, // in %, annually
    inflation,
    minStake: minStake.toString(),
    maxValidatorPerNominator: parseInt(maxNominations),
    maxWithdrawalRequestPerValidator: parseInt(maxUnlockingChunks),
    allowCancelUnstaking: true,
    unstakingPeriod: unlockingPeriod,
    minJoinNominationPool: minPoolJoin,
    nominatorCount: nominatorList.length
  } as ChainStakingMetadata;
}

export async function subscribeRelayChainNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi, ledger: PalletStakingStakingLedger) {
  const chain = chainInfo.slug;
  const chainApi = await substrateApi.isReady;

  const [_nominations, _currentEra, _bonded, _minimumActiveStake, _minNominatorBond, _deriveSessionProgress] = await Promise.all([
    chainApi.api.query?.staking?.nominators(address),
    chainApi.api.query?.staking?.currentEra(),
    chainApi.api.query?.staking?.bonded(address),
    chainApi.api.query?.staking?.minimumActiveStake && chainApi.api.query?.staking?.minimumActiveStake(),
    chainApi.api.query?.staking?.minNominatorBond(),
    chainApi.api.derive?.session?.progress()
  ]);

  const minActiveStake = _minimumActiveStake?.toString() || '0';
  const minNominatorBond = _minNominatorBond.toString();

  const bnMinActiveStake = new BN(minActiveStake);
  const bnMinNominatorBond = new BN(minNominatorBond);

  const minStake = bnMinActiveStake.gt(bnMinNominatorBond) ? bnMinActiveStake : bnMinNominatorBond;

  const unlimitedNominatorRewarded = chainApi.api.consts.staking.maxExposurePageSize !== undefined;
  const _maxNominatorRewardedPerValidator = (chainApi.api.consts.staking.maxNominatorRewardedPerValidator || 0).toString();
  const maxNominatorRewardedPerValidator = parseInt(_maxNominatorRewardedPerValidator);
  const nominations = _nominations.toPrimitive() as unknown as PalletStakingNominations;
  const currentEra = _currentEra.toString();
  const bonded = _bonded.toHuman();

  const activeStake = ledger.active.toString();
  const nominationList: NominationInfo[] = [];
  const unstakingList: UnstakingInfo[] = [];

  if (nominations) {
    const validatorList = nominations.targets;

    await Promise.all(validatorList.map(async (validatorAddress) => {
      let nominationStatus = EarningStatus.NOT_EARNING;
      const [[identity], _eraStaker] = await Promise.all([
        parseIdentity(chainApi, validatorAddress),
        chainApi.api.query.staking.erasStakers(currentEra, validatorAddress)
      ]);
      const eraStaker = _eraStaker.toPrimitive() as unknown as PalletStakingExposure;
      const sortedNominators = eraStaker.others
        .sort((a, b) => {
          return new BigN(b.value).minus(a.value).toNumber();
        })
      ;

      const topNominators = sortedNominators
        .map((nominator) => {
          return nominator.who;
        })
      ;

      if (!topNominators.includes(reformatAddress(address, _getChainSubstrateAddressPrefix(chainInfo)))) { // if nominator has target but not in nominator list
        nominationStatus = EarningStatus.WAITING;
      } else if (topNominators.slice(0, unlimitedNominatorRewarded ? undefined : maxNominatorRewardedPerValidator).includes(reformatAddress(address, _getChainSubstrateAddressPrefix(chainInfo)))) { // if address in top nominators
        nominationStatus = EarningStatus.EARNING_REWARD;
      }

      nominationList.push({
        chain,
        validatorAddress,
        status: nominationStatus,
        validatorIdentity: identity,
        activeStake: '0' // relaychain allocates stake accordingly
      } as NominationInfo);
    }));
  }

  let stakingStatus = EarningStatus.NOT_EARNING;
  const bnActiveStake = new BN(activeStake);
  let waitingNominationCount = 0;

  if (bnActiveStake.gte(minStake)) {
    for (const nomination of nominationList) {
      if (nomination.status === EarningStatus.EARNING_REWARD) { // only need 1 earning nomination to count
        stakingStatus = EarningStatus.EARNING_REWARD;
      } else if (nomination.status === EarningStatus.WAITING) {
        waitingNominationCount += 1;
      }
    }

    if (waitingNominationCount === nominationList.length) {
      stakingStatus = EarningStatus.WAITING;
    }
  }

  ledger.unlocking.forEach((unlockingChunk) => {
    // Calculate the remaining era
    const isClaimable = unlockingChunk.era - parseInt(currentEra) < 0;
    const remainingEra = unlockingChunk.era - parseInt(currentEra);

    // Calculate the remaining time for current era ending
    const expectedBlockTime = _EXPECTED_BLOCK_TIME[chain];
    const eraLength = _deriveSessionProgress.eraLength.toNumber();
    const eraProgress = _deriveSessionProgress.eraProgress.toNumber();
    const remainingSlots = eraLength - eraProgress;
    const remainingHours = expectedBlockTime * remainingSlots / 60 / 60;

    const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chain] + remainingHours;

    unstakingList.push({
      chain,
      status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
      claimable: unlockingChunk.value.toString(),
      waitingTime: waitingTime
    } as UnstakingInfo);
  });

  return {
    chain,
    type: StakingType.NOMINATED,
    status: stakingStatus,
    address: address,
    activeStake,

    nominations: nominationList,
    unstakings: unstakingList,
    isBondedBefore: bonded !== null
  } as NominatorMetadata;
}

/**
 * Deprecated
 * */
export async function getRelayChainNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi): Promise<NominatorMetadata | undefined> {
  if (isEthereumAddress(address)) {
    return;
  }

  const chain = chainInfo.slug;
  const chainApi = await substrateApi.isReady;

  const [_ledger, _nominations, _currentEra, _bonded, _minimumActiveStake, _minNominatorBond] = await Promise.all([
    chainApi.api.query?.staking?.ledger(address),
    chainApi.api.query?.staking?.nominators(address),
    chainApi.api.query?.staking?.currentEra(),
    chainApi.api.query?.staking?.bonded(address),
    chainApi.api.query?.staking?.minimumActiveStake && chainApi.api.query?.staking?.minimumActiveStake(),
    chainApi.api.query?.staking?.minNominatorBond()
  ]);

  const minActiveStake = _minimumActiveStake?.toString() || '0';
  const minNominatorBond = _minNominatorBond.toString();

  const bnMinActiveStake = new BN(minActiveStake);
  const bnMinNominatorBond = new BN(minNominatorBond);

  const minStake = bnMinActiveStake.gt(bnMinNominatorBond) ? bnMinActiveStake : bnMinNominatorBond;

  const unlimitedNominatorRewarded = chainApi.api.consts.staking.maxExposurePageSize !== undefined;
  const _maxNominatorRewardedPerValidator = (chainApi.api.consts.staking.maxNominatorRewardedPerValidator || 0).toString();
  const maxNominatorRewardedPerValidator = parseInt(_maxNominatorRewardedPerValidator);
  const ledger = _ledger.toPrimitive() as unknown as PalletStakingStakingLedger;
  const nominations = _nominations.toPrimitive() as unknown as PalletStakingNominations;
  const currentEra = _currentEra.toString();
  const bonded = _bonded.toHuman();

  if (!ledger) {
    return {
      chain,
      type: StakingType.NOMINATED,
      status: EarningStatus.NOT_STAKING,
      address: address,
      activeStake: '0',

      nominations: [],
      unstakings: []
    } as NominatorMetadata;
  }

  const activeStake = ledger.active.toString();
  const nominationList: NominationInfo[] = [];
  const unstakingList: UnstakingInfo[] = [];

  if (nominations) {
    const validatorList = nominations.targets;

    await Promise.all(validatorList.map(async (validatorAddress) => {
      let nominationStatus = EarningStatus.NOT_EARNING;
      const [[identity], _eraStaker] = await Promise.all([
        parseIdentity(chainApi, validatorAddress),
        chainApi.api.query.staking.erasStakers(currentEra, validatorAddress)
      ]);
      const eraStaker = _eraStaker.toPrimitive() as unknown as PalletStakingExposure;
      const sortedNominators = eraStaker.others
        .sort((a, b) => {
          return new BigN(b.value).minus(a.value).toNumber();
        })
      ;

      const topNominators = sortedNominators
        .map((nominator) => {
          return nominator.who;
        })
      ;

      if (!topNominators.includes(reformatAddress(address, _getChainSubstrateAddressPrefix(chainInfo)))) { // if nominator has target but not in nominator list
        nominationStatus = EarningStatus.WAITING;
      } else if (topNominators.slice(0, unlimitedNominatorRewarded ? undefined : maxNominatorRewardedPerValidator).includes(reformatAddress(address, _getChainSubstrateAddressPrefix(chainInfo)))) { // if address in top nominators
        nominationStatus = EarningStatus.EARNING_REWARD;
      }

      nominationList.push({
        chain,
        validatorAddress,
        status: nominationStatus,
        validatorIdentity: identity,
        activeStake: '0' // relaychain allocates stake accordingly
      } as NominationInfo);
    }));
  }

  let stakingStatus = EarningStatus.NOT_EARNING;
  const bnActiveStake = new BN(activeStake);
  let waitingNominationCount = 0;

  if (bnActiveStake.gte(minStake)) {
    for (const nomination of nominationList) {
      if (nomination.status === EarningStatus.EARNING_REWARD) { // only need 1 earning nomination to count
        stakingStatus = EarningStatus.EARNING_REWARD;
      } else if (nomination.status === EarningStatus.WAITING) {
        waitingNominationCount += 1;
      }
    }

    if (waitingNominationCount === nominationList.length) {
      stakingStatus = EarningStatus.WAITING;
    }
  }

  ledger.unlocking.forEach((unlockingChunk) => {
    const isClaimable = unlockingChunk.era - parseInt(currentEra) < 0;
    const remainingEra = unlockingChunk.era - parseInt(currentEra);
    const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chain];

    unstakingList.push({
      chain,
      status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
      claimable: unlockingChunk.value.toString(),
      waitingTime: waitingTime
    } as UnstakingInfo);
  });

  return {
    chain,
    type: StakingType.NOMINATED,
    status: stakingStatus,
    address: address,
    activeStake,

    nominations: nominationList,
    unstakings: unstakingList,
    isBondedBefore: bonded !== null
  } as NominatorMetadata;
}

export async function subscribeRelayChainPoolMemberMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi, poolMemberInfo: PalletNominationPoolsPoolMember) {
  const unlimitedNominatorRewarded = substrateApi.api.consts.staking.maxExposurePageSize !== undefined;
  const _maxNominatorRewardedPerValidator = (substrateApi.api.consts.staking.maxNominatorRewardedPerValidator || 0).toString();
  const maxNominatorRewardedPerValidator = parseInt(_maxNominatorRewardedPerValidator);
  const poolsPalletId = substrateApi.api.consts.nominationPools.palletId.toString();
  const poolStashAccount = parsePoolStashAddress(substrateApi.api, 0, poolMemberInfo.poolId, poolsPalletId);

  const [_nominations, _poolMetadata, _currentEra, _deriveSessionProgress] = await Promise.all([
    substrateApi.api.query.staking.nominators(poolStashAccount),
    substrateApi.api.query.nominationPools.metadata(poolMemberInfo.poolId),
    substrateApi.api.query.staking.currentEra(),
    substrateApi.api.derive?.session?.progress()
  ]);

  const poolMetadata = _poolMetadata.toPrimitive() as unknown as Bytes;
  const currentEra = _currentEra.toString();
  const nominations = _nominations.toJSON() as unknown as PalletStakingNominations;

  let stakingStatus = EarningStatus.NOT_EARNING;

  const getPoolName = () => {
    if (poolMetadata.isUtf8) {
      return poolMetadata.toUtf8();
    } else {
      const str = poolMetadata.toString();

      return isHex(str) ? hexToString(str) : str;
    }
  };

  const poolName = getPoolName();

  if (nominations) {
    const validatorList = nominations.targets;

    await Promise.all(validatorList.map(async (validatorAddress) => {
      const _eraStaker = await substrateApi.api.query.staking.erasStakers(currentEra, validatorAddress);
      const eraStaker = _eraStaker.toPrimitive() as unknown as PalletStakingExposure;

      const sortedNominators = eraStaker.others
        .sort((a, b) => {
          return new BigN(b.value).minus(a.value).toNumber();
        })
      ;

      const topNominators = sortedNominators
        .map((nominator) => {
          return nominator.who;
        })
        .slice(0, unlimitedNominatorRewarded ? undefined : maxNominatorRewardedPerValidator)
      ;

      if (topNominators.includes(reformatAddress(poolStashAccount, _getChainSubstrateAddressPrefix(chainInfo)))) { // if address in top nominators
        stakingStatus = EarningStatus.EARNING_REWARD;
      }
    }));
  }

  const joinedPoolInfo: NominationInfo = {
    activeStake: poolMemberInfo.points.toString(),
    chain: chainInfo.slug,
    status: stakingStatus,
    validatorIdentity: poolName,
    validatorAddress: poolMemberInfo.poolId.toString(), // use poolId
    hasUnstaking: poolMemberInfo.unbondingEras && Object.keys(poolMemberInfo.unbondingEras).length > 0
  };

  const unstakings: UnstakingInfo[] = [];

  Object.entries(poolMemberInfo.unbondingEras).forEach(([unlockingEra, amount]) => {
    const isClaimable = parseInt(unlockingEra) - parseInt(currentEra) < 0;
    const remainingEra = parseInt(unlockingEra) - parseInt(currentEra);
    // const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chainInfo.slug];

    // Calculate the remaining time for current era ending
    const expectedBlockTime = _EXPECTED_BLOCK_TIME[chainInfo.slug];
    const eraLength = _deriveSessionProgress.eraLength.toNumber();
    const eraProgress = _deriveSessionProgress.eraProgress.toNumber();
    const remainingSlots = eraLength - eraProgress;
    const remainingHours = expectedBlockTime * remainingSlots / 60 / 60;

    const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chainInfo.slug] + remainingHours;

    unstakings.push({
      chain: chainInfo.slug,
      status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
      claimable: amount.toString(),
      waitingTime: waitingTime
    } as UnstakingInfo);
  });

  const bnActiveStake = new BN(poolMemberInfo.points.toString());

  if (!bnActiveStake.gt(BN_ZERO)) {
    stakingStatus = EarningStatus.NOT_EARNING;
  }

  return {
    chain: chainInfo.slug,
    type: StakingType.POOLED,
    address,
    status: stakingStatus,
    activeStake: poolMemberInfo.points.toString(),
    nominations: [joinedPoolInfo], // can only join 1 pool at a time
    unstakings
  } as NominatorMetadata;
}

/**
 * Deprecated
 *  */
export async function getRelayChainPoolMemberMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi): Promise<NominatorMetadata | undefined> {
  const chainApi = await substrateApi.isReady;

  const [_poolMemberInfo, _currentEra] = await Promise.all([
    chainApi.api.query.nominationPools.poolMembers(address),
    chainApi.api.query.staking.currentEra()
  ]);

  const unlimitedNominatorRewarded = chainApi.api.consts.staking.maxExposurePageSize !== undefined;
  const _maxNominatorRewardedPerValidator = (chainApi.api.consts.staking.maxNominatorRewardedPerValidator || 0).toString();
  const maxNominatorRewardedPerValidator = parseInt(_maxNominatorRewardedPerValidator);
  const poolsPalletId = chainApi.api.consts.nominationPools.palletId.toString();
  const poolMemberInfo = _poolMemberInfo.toPrimitive() as unknown as PalletNominationPoolsPoolMember;
  const currentEra = _currentEra.toString();

  if (!poolMemberInfo) {
    return {
      chain: chainInfo.slug,
      type: StakingType.POOLED,
      address,
      status: EarningStatus.NOT_STAKING,
      activeStake: '0',
      nominations: [], // can only join 1 pool at a time
      unstakings: []
    } as NominatorMetadata;
  }

  let stakingStatus = EarningStatus.NOT_EARNING;

  const _poolMetadata = (await chainApi.api.query.nominationPools.metadata(poolMemberInfo.poolId));
  const poolMetadata = _poolMetadata.toPrimitive() as unknown as Bytes;

  const getPoolName = () => {
    if (poolMetadata.isUtf8) {
      return poolMetadata.toUtf8();
    } else {
      const str = poolMetadata.toString();

      return isHex(str) ? hexToString(str) : str;
    }
  };

  const poolName = getPoolName();
  const poolStashAccount = parsePoolStashAddress(chainApi.api, 0, poolMemberInfo.poolId, poolsPalletId);

  const _nominations = await chainApi.api.query.staking.nominators(poolStashAccount);
  const nominations = _nominations.toJSON() as unknown as PalletStakingNominations;

  if (nominations) {
    const validatorList = nominations.targets;

    await Promise.all(validatorList.map(async (validatorAddress) => {
      const _eraStaker = await chainApi.api.query.staking.erasStakers(currentEra, validatorAddress);
      const eraStaker = _eraStaker.toPrimitive() as unknown as PalletStakingExposure;

      const sortedNominators = eraStaker.others
        .sort((a, b) => {
          return new BigN(b.value).minus(a.value).toNumber();
        })
      ;

      const topNominators = sortedNominators
        .map((nominator) => {
          return nominator.who;
        })
        .slice(0, unlimitedNominatorRewarded ? undefined : maxNominatorRewardedPerValidator)
      ;

      if (topNominators.includes(reformatAddress(poolStashAccount, _getChainSubstrateAddressPrefix(chainInfo)))) { // if address in top nominators
        stakingStatus = EarningStatus.EARNING_REWARD;
      }
    }));
  }

  const joinedPoolInfo: NominationInfo = {
    activeStake: poolMemberInfo.points.toString(),
    chain: chainInfo.slug,
    status: stakingStatus,
    validatorIdentity: poolName,
    validatorAddress: poolMemberInfo.poolId.toString(), // use poolId
    hasUnstaking: poolMemberInfo.unbondingEras && Object.keys(poolMemberInfo.unbondingEras).length > 0
  };

  const unstakings: UnstakingInfo[] = [];

  Object.entries(poolMemberInfo.unbondingEras).forEach(([unlockingEra, amount]) => {
    const isClaimable = parseInt(unlockingEra) - parseInt(currentEra) < 0;
    const remainingEra = parseInt(unlockingEra) - parseInt(currentEra);
    const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chainInfo.slug];

    unstakings.push({
      chain: chainInfo.slug,
      status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
      claimable: amount.toString(),
      waitingTime: waitingTime
    } as UnstakingInfo);
  });

  const bnActiveStake = new BN(poolMemberInfo.points.toString());

  if (!bnActiveStake.gt(BN_ZERO)) {
    stakingStatus = EarningStatus.NOT_EARNING;
  }

  return {
    chain: chainInfo.slug,
    type: StakingType.POOLED,
    address,
    status: stakingStatus,
    activeStake: poolMemberInfo.points.toString(),
    nominations: [joinedPoolInfo], // can only join 1 pool at a time
    unstakings
  } as NominatorMetadata;
}

export async function getRelayValidatorsInfo (chain: string, substrateApi: _SubstrateApi, decimals: number, chainStakingMetadata: ChainStakingMetadata): Promise<ValidatorInfo[]> {
  const chainApi = await substrateApi.isReady;

  const _era = await chainApi.api.query.staking.currentEra();
  const currentEra = _era.toString();

  const allValidators: string[] = [];
  const validatorInfoList: ValidatorInfo[] = [];

  const [_totalEraStake, _eraStakers, _minBond, _stakingRewards] = await Promise.all([
    chainApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
    chainApi.api.query.staking.erasStakers.entries(parseInt(currentEra)),
    chainApi.api.query.staking.minNominatorBond(),
    chainApi.api.query.stakingRewards?.data && chainApi.api.query.stakingRewards.data()
  ]);

  const stakingRewards = _stakingRewards?.toPrimitive() as unknown as TernoaStakingRewardsStakingRewardsData;

  const unlimitedNominatorRewarded = chainApi.api.consts.staking.maxExposurePageSize !== undefined;
  const maxNominatorRewarded = (chainApi.api.consts.staking.maxNominatorRewardedPerValidator || 0).toString();
  const bnTotalEraStake = new BN(_totalEraStake.toString());
  const eraStakers = _eraStakers as any[];

  const rawMinBond = _minBond.toHuman();
  const minBond = rawMinBond.replaceAll(',', '');

  const totalStakeMap: Record<string, BN> = {};
  const bnDecimals = new BN((10 ** decimals).toString());

  for (const item of eraStakers) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const rawValidatorInfo = item[0].toHuman() as any[];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const rawValidatorStat = item[1].toHuman() as Record<string, any>;

    const validatorAddress = rawValidatorInfo[1] as string;
    const rawTotalStake = rawValidatorStat.total as string;
    const rawOwnStake = rawValidatorStat.own as string;

    const bnTotalStake = new BN(rawTotalStake.replaceAll(',', ''));
    const bnOwnStake = new BN(rawOwnStake.replaceAll(',', ''));
    const otherStake = bnTotalStake.sub(bnOwnStake);

    totalStakeMap[validatorAddress] = bnTotalStake;

    let nominatorCount = 0;

    if ('others' in rawValidatorStat) {
      const others = rawValidatorStat.others as Record<string, any>[];

      nominatorCount = others.length;
    }

    allValidators.push(validatorAddress);

    validatorInfoList.push({
      address: validatorAddress,
      totalStake: bnTotalStake.toString(),
      ownStake: bnOwnStake.toString(),
      otherStake: otherStake.toString(),
      nominatorCount,
      // to be added later
      commission: 0,
      expectedReturn: 0,
      blocked: false,
      isVerified: false,
      minBond,
      isCrowded: unlimitedNominatorRewarded ? false : nominatorCount > parseInt(maxNominatorRewarded)
    } as ValidatorInfo);
  }

  const extraInfoMap: Record<string, ValidatorExtraInfo> = {};

  await Promise.all(allValidators.map(async (address) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [_commissionInfo, [identity, isVerified]] = await Promise.all([
      chainApi.api.query.staking.validators(address),
      parseIdentity(chainApi, address)
    ]);

    const commissionInfo = _commissionInfo.toHuman() as Record<string, any>;

    extraInfoMap[address] = {
      commission: commissionInfo.commission as string,
      blocked: commissionInfo.blocked as boolean,
      identity,
      isVerified: isVerified
    } as ValidatorExtraInfo;
  }));

  const bnAvgStake = bnTotalEraStake.divn(validatorInfoList.length).div(bnDecimals);

  for (const validator of validatorInfoList) {
    const commission = extraInfoMap[validator.address].commission;

    const bnValidatorStake = totalStakeMap[validator.address].div(bnDecimals);

    if (_STAKING_CHAIN_GROUP.aleph.includes(chain)) {
      validator.expectedReturn = calculateAlephZeroValidatorReturn(chainStakingMetadata.expectedReturn as number, getCommission(commission));
    } else if (_STAKING_CHAIN_GROUP.ternoa.includes(chain)) {
      const rewardPerValidator = new BN(stakingRewards.sessionExtraRewardPayout).divn(allValidators.length).div(bnDecimals);
      const validatorStake = totalStakeMap[validator.address].div(bnDecimals).toNumber();

      validator.expectedReturn = calculateTernoaValidatorReturn(rewardPerValidator.toNumber(), validatorStake, getCommission(commission));
    } else {
      validator.expectedReturn = calculateValidatorStakedReturn(chainStakingMetadata.expectedReturn as number, bnValidatorStake, bnAvgStake, getCommission(commission));
    }

    validator.commission = parseFloat(commission.split('%')[0]);
    validator.blocked = extraInfoMap[validator.address].blocked;
    validator.identity = extraInfoMap[validator.address].identity;
    validator.isVerified = extraInfoMap[validator.address].isVerified;
  }

  return validatorInfoList;
}

export async function getRelayPoolsInfo (chain: string, substrateApi: _SubstrateApi): Promise<NominationPoolInfo[]> {
  const chainApi = await substrateApi.isReady;

  const nominationPools: NominationPoolInfo[] = [];

  const _allPoolsInfo = await chainApi.api.query.nominationPools.reversePoolIdLookup.entries();

  await Promise.all(_allPoolsInfo.map(async (_poolInfo) => {
    const poolAddressList = _poolInfo[0].toHuman() as string[];
    const poolAddress = poolAddressList[0];
    const poolId = _poolInfo[1].toPrimitive() as number;
    const poolsPalletId = substrateApi.api.consts.nominationPools.palletId.toString();
    const poolStashAccount = parsePoolStashAddress(substrateApi.api, 0, poolId, poolsPalletId);

    const [_nominations, _bondedPool, _metadata, _minimumActiveStake] = await Promise.all([
      chainApi.api.query.staking.nominators(poolStashAccount),
      chainApi.api.query.nominationPools.bondedPools(poolId),
      chainApi.api.query.nominationPools.metadata(poolId),
      chainApi.api.query.staking.minimumActiveStake()
    ]);

    const minimumActiveStake = _minimumActiveStake.toPrimitive() as number;
    const nominations = _nominations.toJSON() as unknown as PalletStakingNominations;

    const poolMetadata = _metadata.toPrimitive() as unknown as string;
    const bondedPool = _bondedPool.toPrimitive() as unknown as PalletNominationPoolsBondedPoolInner;

    // const poolName = transformPoolName(poolMetadata.isUtf8 ? poolMetadata.toUtf8() : poolMetadata.toString());

    const poolName = isHex(poolMetadata) ? hexToString(poolMetadata) : poolMetadata;

    const isPoolOpen = bondedPool.state === 'Open';
    const isPoolNominating = !!nominations && nominations.targets.length > 0;
    const isPoolEarningReward = bondedPool.points > minimumActiveStake;

    nominationPools.push({
      id: poolId,
      address: poolAddress,
      name: poolName,
      bondedAmount: bondedPool.points?.toString() || '0',
      roles: bondedPool.roles,
      memberCounter: bondedPool.memberCounter,
      state: bondedPool.state,
      isProfitable: isPoolOpen && isPoolNominating && isPoolEarningReward
    });
  }));

  return nominationPools;
}

export async function getRelayBondingExtrinsic (substrateApi: _SubstrateApi, amount: string, targetValidators: ValidatorInfo[], chainInfo: _ChainInfo, address: string, nominatorMetadata?: NominatorMetadata, bondDest = 'Staked') {
  const chainApi = await substrateApi.isReady;
  const binaryAmount = new BN(amount);

  let bondTx;
  let nominateTx;

  const _params = chainApi.api.tx.staking.bond.toJSON() as Record<string, any>;
  const paramsCount = (_params.args as any[]).length;

  const validatorParamList = targetValidators.map((validator) => {
    return validator.address;
  });

  if (!nominatorMetadata) {
    if (paramsCount === 2) {
      bondTx = chainApi.api.tx.staking.bond(binaryAmount, bondDest);
    } else {
      // @ts-ignore
      bondTx = chainApi.api.tx.staking.bond(address, binaryAmount, bondDest);
    }

    nominateTx = chainApi.api.tx.staking.nominate(validatorParamList);

    return chainApi.api.tx.utility.batchAll([bondTx, nominateTx]);
  }

  if (!nominatorMetadata.isBondedBefore) { // first time
    if (paramsCount === 2) {
      bondTx = chainApi.api.tx.staking.bond(binaryAmount, bondDest);
    } else {
      // @ts-ignore
      bondTx = chainApi.api.tx.staking.bond(nominatorMetadata.address, binaryAmount, bondDest);
    }

    nominateTx = chainApi.api.tx.staking.nominate(validatorParamList);

    return chainApi.api.tx.utility.batchAll([bondTx, nominateTx]);
  } else {
    if (binaryAmount.gt(BN_ZERO)) {
      bondTx = chainApi.api.tx.staking.bondExtra(binaryAmount);
    }

    if (nominatorMetadata.isBondedBefore && targetValidators.length > 0) {
      nominateTx = chainApi.api.tx.staking.nominate(validatorParamList);
    }
  }

  if (bondTx && !nominateTx) {
    return bondTx;
  } else if (nominateTx && !bondTx) {
    return nominateTx;
  }

  // @ts-ignore
  return chainApi.api.tx.utility.batchAll([bondTx, nominateTx]);
}

export async function getRelayUnbondingExtrinsic (substrateApi: _SubstrateApi, amount: string, nominatorMetadata: NominatorMetadata) {
  const chainApi = await substrateApi.isReady;
  const binaryAmount = new BN(amount);

  const isUnstakeAll = amount === nominatorMetadata.activeStake;

  if (isUnstakeAll) {
    const chillTx = chainApi.api.tx.staking.chill();
    const unbondTx = chainApi.api.tx.staking.unbond(binaryAmount);

    return chainApi.api.tx.utility.batchAll([chillTx, unbondTx]);
  }

  return chainApi.api.tx.staking.unbond(binaryAmount);
}

export async function getRelayWithdrawalExtrinsic (substrateApi: _SubstrateApi, address: string) {
  const chainApi = await substrateApi.isReady;

  if (chainApi.api.tx.staking.withdrawUnbonded.meta.args.length === 1) {
    const _slashingSpans = (await chainApi.api.query.staking.slashingSpans(address)).toHuman() as Record<string, any>;
    const slashingSpanCount = _slashingSpans !== null ? _slashingSpans.spanIndex as string : '0';

    return chainApi.api.tx.staking.withdrawUnbonded(slashingSpanCount);
  } else {
    // @ts-ignore
    return chainApi.api.tx.staking.withdrawUnbonded();
  }
}

export async function getRelayCancelWithdrawalExtrinsic (substrateApi: _SubstrateApi, selectedUnstaking: UnstakingInfo) {
  const chainApi = await substrateApi.isReady;

  return chainApi.api.tx.staking.rebond(selectedUnstaking.claimable);
}

// Pooling txs

export async function getPoolingClaimRewardExtrinsic (substrateApi: _SubstrateApi, bondReward = true) {
  const chainApi = await substrateApi.isReady;

  if (bondReward) {
    return chainApi.api.tx.nominationPools.bondExtra('Rewards');
  }

  return chainApi.api.tx.nominationPools.claimPayout();
}

export async function getPoolingBondingExtrinsic (substrateApi: _SubstrateApi, amount: string, selectedPoolId: number, nominatorMetadata: NominatorMetadata | undefined) {
  const chainApi = await substrateApi.isReady;
  const bnActiveStake = new BN(nominatorMetadata?.activeStake || '0');

  if (bnActiveStake.gt(BN_ZERO)) { // already joined a pool
    return chainApi.api.tx.nominationPools.bondExtra({ FreeBalance: amount });
  }

  return chainApi.api.tx.nominationPools.join(amount, selectedPoolId);
}

export async function getPoolingUnbondingExtrinsic (substrateApi: _SubstrateApi, amount: string, nominatorMetadata: NominatorMetadata) {
  const chainApi = await substrateApi.isReady;

  return chainApi.api.tx.nominationPools.unbond({ Id: nominatorMetadata.address }, amount);
}

export async function getPoolingWithdrawalExtrinsic (substrateApi: _SubstrateApi, nominatorMetadata: NominatorMetadata) {
  const chainApi = await substrateApi.isReady;

  if (chainApi.api.tx.nominationPools.withdrawUnbonded.meta.args.length === 2) {
    const _slashingSpans = (await chainApi.api.query.staking.slashingSpans(nominatorMetadata.address)).toHuman() as Record<string, any>;
    const slashingSpanCount = _slashingSpans !== null ? _slashingSpans.spanIndex as string : '0';

    return chainApi.api.tx.nominationPools.withdrawUnbonded({ Id: nominatorMetadata.address }, slashingSpanCount);
  } else {
    // @ts-ignore
    return chainApi.api.tx.nominationPools.withdrawUnbonded({ Id: nominatorMetadata.address });
  }
}
