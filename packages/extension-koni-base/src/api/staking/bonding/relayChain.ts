// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ChainStakingMetadata, NominationInfo, NominationPoolInfo, NominatorMetadata, PalletNominationPoolsBondedPoolInner, StakingType, UnstakingInfo, UnstakingStatus, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_CHAIN_GROUP, _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { calculateAlephZeroValidatorReturn, calculateChainStakedReturn, calculateInflation, calculateValidatorStakedReturn, getCommission, PalletIdentityRegistration, PalletNominationPoolsPoolMember, parseIdentity, transformPoolName, ValidatorExtraInfo } from '@subwallet/extension-koni-base/api/staking/bonding/utils';

import { Bytes } from '@polkadot/types';
import { BN, BN_ZERO } from '@polkadot/util';
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

export async function getRelayChainStakingMetadata (chain: string, substrateApi: _SubstrateApi): Promise<ChainStakingMetadata> {
  const chainApi = await substrateApi.isReady;
  const _era = await chainApi.api.query.staking.currentEra();
  const currentEra = _era.toString();
  const maxNominations = chainApi.api.consts.staking.maxNominations.toString();
  const maxUnlockingChunks = chainApi.api.consts.staking.maxUnlockingChunks.toString();
  const unlockingEras = chainApi.api.consts.staking.bondingDuration.toString();

  const [_totalEraStake, _totalIssuance, _auctionCounter, _minimumActiveStake, _minPoolJoin] = await Promise.all([
    chainApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
    chainApi.api.query.balances.totalIssuance(),
    chainApi.api.query.auctions?.auctionCounter(),
    chainApi.api.query.staking.minimumActiveStake(),
    chainApi.api.query?.nominationPools?.minJoinBond()
  ]);

  const minStake = _minimumActiveStake.toString();

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
    expectedReturn, // in %, annually
    inflation,
    minStake,
    maxValidatorPerNominator: parseInt(maxNominations),
    maxWithdrawalRequestPerValidator: parseInt(maxUnlockingChunks),
    allowCancelUnstaking: true,
    unstakingPeriod: unlockingPeriod,
    minJoinNominationPool: minPoolJoin
  } as ChainStakingMetadata;
}

export async function getRelayChainNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi): Promise<NominatorMetadata | undefined> {
  if (isEthereumAddress(address)) {
    return;
  }

  const chain = chainInfo.slug;
  const chainApi = await substrateApi.isReady;

  const [_ledger, _nominations, _currentEra, _bonded] = await Promise.all([
    chainApi.api.query.staking.ledger(address),
    chainApi.api.query.staking.nominators(address),
    chainApi.api.query.staking.currentEra(),
    chainApi.api.query.staking.bonded(address)
  ]);

  const ledger = _ledger.toJSON() as unknown as PalletStakingStakingLedger;
  const nominations = _nominations.toJSON() as unknown as PalletStakingNominations;
  const currentEra = _currentEra.toString();
  const bonded = _bonded.toHuman();

  if (!ledger) {
    return;
  }

  const activeStake = ledger.active.toString();
  const nominationList: NominationInfo[] = [];
  const unstakingList: UnstakingInfo[] = [];

  if (nominations) {
    const validatorList = nominations.targets;

    await Promise.all(validatorList.map(async (validatorAddress) => {
      const identityInfo = (await chainApi.api.query.identity.identityOf(validatorAddress)).toHuman() as unknown as PalletIdentityRegistration;
      const identity = parseIdentity(identityInfo);

      nominationList.push({
        chain,
        validatorAddress,
        validatorIdentity: identity,
        activeStake: '0' // relaychain allocates stake accordingly
      } as NominationInfo);
    }));
  }

  ledger.unlocking.forEach((unlockingChunk) => {
    const isClaimable = unlockingChunk.era - parseInt(currentEra) <= 0;
    const remainingEra = unlockingChunk.era - (parseInt(currentEra) + 1);
    const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chain];

    unstakingList.push({
      chain,
      status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
      claimable: unlockingChunk.value.toString(),
      waitingTime: waitingTime > 0 ? waitingTime : 0
    } as UnstakingInfo);
  });

  return {
    chain,
    type: StakingType.NOMINATED,
    address: address,
    activeStake,

    nominations: nominationList,
    unstakings: unstakingList,
    isBondedBefore: bonded !== null
  } as NominatorMetadata;
}

export async function getRelayChainPoolMemberMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi): Promise<NominatorMetadata | undefined> {
  const chainApi = await substrateApi.isReady;

  const [_poolMemberInfo, _currentEra] = await Promise.all([
    chainApi.api.query.nominationPools.poolMembers(address),
    chainApi.api.query.staking.currentEra()
  ]);

  const poolMemberInfo = _poolMemberInfo.toPrimitive() as unknown as PalletNominationPoolsPoolMember;
  const currentEra = _currentEra.toString();

  if (!poolMemberInfo) {
    return;
  }

  const _poolMetadata = (await chainApi.api.query.nominationPools.metadata(poolMemberInfo.poolId));
  const poolMetadata = _poolMetadata.toPrimitive() as unknown as Bytes;

  const poolName = transformPoolName(poolMetadata.isUtf8 ? poolMetadata.toUtf8() : poolMetadata.toString());

  const joinedPoolInfo: NominationInfo = {
    activeStake: poolMemberInfo.points.toString(),
    chain: chainInfo.slug,
    validatorIdentity: poolName,
    validatorAddress: poolMemberInfo.poolId.toString(), // use poolId
    hasUnstaking: poolMemberInfo.unbondingEras && Object.keys(poolMemberInfo.unbondingEras).length > 0
  };

  const unstakings: UnstakingInfo[] = [];

  Object.entries(poolMemberInfo.unbondingEras).forEach(([unlockingEra, amount]) => {
    const isClaimable = parseInt(unlockingEra) - parseInt(currentEra) <= 0;
    const remainingEra = parseInt(unlockingEra) - (parseInt(currentEra) + 1);
    const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chainInfo.slug];

    unstakings.push({
      chain: chainInfo.slug,
      status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
      claimable: amount.toString(),
      waitingTime: waitingTime > 0 ? waitingTime : 0
    } as UnstakingInfo);
  });

  return {
    chain: chainInfo.slug,
    type: StakingType.POOLED,
    address,
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

  const [_totalEraStake, _eraStakers, _minBond] = await Promise.all([
    chainApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
    chainApi.api.query.staking.erasStakers.entries(parseInt(currentEra)),
    chainApi.api.query.staking.minNominatorBond()
  ]);

  const maxNominatorRewarded = chainApi.api.consts.staking.maxNominatorRewardedPerValidator.toString();
  const bnTotalEraStake = new BN(_totalEraStake.toString());
  const eraStakers = _eraStakers as any[];

  const rawMinBond = _minBond.toHuman() as string;
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
      isCrowded: nominatorCount > parseInt(maxNominatorRewarded)
    } as ValidatorInfo);
  }

  const extraInfoMap: Record<string, ValidatorExtraInfo> = {};

  await Promise.all(allValidators.map(async (address) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [_commissionInfo, _identityInfo] = await Promise.all([
      chainApi.api.query.staking.validators(address),
      chainApi.api.query?.identity?.identityOf(address)
    ]);

    const commissionInfo = _commissionInfo.toHuman() as Record<string, any>;
    const identityInfo = _identityInfo ? (_identityInfo.toHuman() as unknown as PalletIdentityRegistration) : null;
    let identity;

    if (identityInfo !== null) {
      identity = parseIdentity(identityInfo);
    }

    extraInfoMap[address] = {
      commission: commissionInfo.commission as string,
      blocked: commissionInfo.blocked as boolean,
      identity,
      isVerified: identityInfo && identityInfo?.judgements?.length > 0
    } as ValidatorExtraInfo;
  }));

  const bnAvgStake = bnTotalEraStake.divn(validatorInfoList.length).div(bnDecimals);

  for (const validator of validatorInfoList) {
    const commission = extraInfoMap[validator.address].commission;

    const bnValidatorStake = totalStakeMap[validator.address].div(bnDecimals);

    validator.expectedReturn = _STAKING_CHAIN_GROUP.aleph.includes(chain)
      ? calculateAlephZeroValidatorReturn(chainStakingMetadata.expectedReturn as number, getCommission(commission))
      : calculateValidatorStakedReturn(chainStakingMetadata.expectedReturn as number, bnValidatorStake, bnAvgStake, getCommission(commission));
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

    const [_bondedPool, _metadata] = await Promise.all([
      chainApi.api.query.nominationPools.bondedPools(poolId),
      chainApi.api.query.nominationPools.metadata(poolId)
    ]);

    const poolMetadata = _metadata.toPrimitive() as unknown as Bytes;
    const bondedPool = _bondedPool.toPrimitive() as unknown as PalletNominationPoolsBondedPoolInner;

    const poolName = transformPoolName(poolMetadata.isUtf8 ? poolMetadata.toUtf8() : poolMetadata.toString());

    nominationPools.push({
      id: poolId,
      address: poolAddress,
      name: poolName,
      bondedAmount: bondedPool.points?.toString() || '0',
      roles: bondedPool.roles,
      memberCounter: bondedPool.memberCounter,
      state: bondedPool.state
    });
  }));

  return nominationPools;
}

export async function getRelayBondingExtrinsic (substrateApi: _SubstrateApi, amount: string, targetValidators: ValidatorInfo[], nominatorMetadata: NominatorMetadata, chainInfo: _ChainInfo, bondDest = 'Staked') {
  const chainApi = await substrateApi.isReady;
  const binaryAmount = new BN(amount);

  let bondTx;
  let nominateTx;

  if (!nominatorMetadata.isBondedBefore) { // first time
    bondTx = chainApi.api.tx.staking.bond(nominatorMetadata.address, binaryAmount, bondDest);
    nominateTx = chainApi.api.tx.staking.nominate(targetValidators);

    return chainApi.api.tx.utility.batchAll([bondTx, nominateTx]);
  } else {
    if (binaryAmount.gt(BN_ZERO)) {
      bondTx = chainApi.api.tx.staking.bondExtra(binaryAmount);
    }

    if (nominatorMetadata.isBondedBefore && targetValidators.length > 0) {
      nominateTx = chainApi.api.tx.staking.nominate(targetValidators);
    }
  }

  if (bondTx && !nominateTx) {
    return bondTx;
  } else if (nominateTx && !bondTx) {
    return nominateTx;
  }

  return chainApi.api.tx.utility.batchAll([bondTx, nominateTx]);
}

export async function getRelayUnbondingExtrinsic (substrateApi: _SubstrateApi, amount: number, chainInfo: _ChainInfo) {
  const chainApi = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = Math.floor(amount * (10 ** decimals));
  const binaryAmount = new BN(parsedAmount.toString());

  const chillTx = chainApi.api.tx.staking.chill();
  const unbondTx = chainApi.api.tx.staking.unbond(binaryAmount);

  return chainApi.api.tx.utility.batchAll([chillTx, unbondTx]);
}

export async function getRelayWithdrawalExtrinsic (substrateApi: _SubstrateApi, address: string) {
  const chainApi = await substrateApi.isReady;

  if (chainApi.api.tx.staking.withdrawUnbonded.meta.args.length === 1) {
    const _slashingSpans = (await chainApi.api.query.staking.slashingSpans(address)).toHuman() as Record<string, any>;
    const slashingSpanCount = _slashingSpans !== null ? _slashingSpans.spanIndex as string : '0';

    return chainApi.api.tx.staking.withdrawUnbonded(slashingSpanCount);
  } else {
    return chainApi.api.tx.staking.withdrawUnbonded();
  }
}

export async function getPoolingClaimRewardExtrinsic (substrateApi: _SubstrateApi) {
  const chainApi = await substrateApi.isReady;

  return chainApi.api.tx.nominationPools.claimPayout();
}
