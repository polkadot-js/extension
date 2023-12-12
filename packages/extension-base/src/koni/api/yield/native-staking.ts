// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ChainStakingMetadata, NominatorMetadata, OptimalYieldPath, OptimalYieldPathParams, StakingType, YieldPoolInfo, YieldPositionInfo, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { getPoolingBondingExtrinsic, getRelayBondingExtrinsic, PalletStakingStakingLedger, subscribeRelayChainNominatorMetadata, subscribeRelayChainPoolMemberMetadata } from '@subwallet/extension-base/koni/api/staking/bonding/relayChain';
import { calculateChainStakedReturn, calculateInflation, PalletNominationPoolsPoolMember } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { YIELD_POOLS_INFO } from '@subwallet/extension-base/koni/api/yield/data';
import { DEFAULT_YIELD_FIRST_STEP, syntheticSelectedValidators } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import { _STAKING_CHAIN_GROUP, fakeAddress } from '@subwallet/extension-base/services/earning-service/constants';
import {
  EarningStatus,
  RuntimeDispatchInfo,
  SubmitJoinNativeStaking,
  SubmitJoinNominationPool,
  YieldPoolType
} from '@subwallet/extension-base/types';
import { reformatAddress } from '@subwallet/extension-base/utils';

import { Codec } from '@polkadot/types/types';
import { BN } from '@polkadot/util';

export function subscribeNativeStakingYieldStats (poolInfo: YieldPoolInfo, substrateApi: _SubstrateApi, chainInfo: _ChainInfo, callback: (rs: YieldPoolInfo) => void) {
  return substrateApi.api.query.staking.currentEra(async (_currentEra: Codec) => {
    const currentEra = _currentEra.toString();
    const maxNominations = substrateApi.api.consts.staking?.maxNominations?.toString() || '16'; // TODO
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
    const minPoolJoin = _minPoolJoin?.toString() || undefined;
    const expectedReturn = calculateChainStakedReturn(inflation, bnTotalEraStake, bnTotalIssuance, chainInfo.slug);
    const unlockingPeriod = parseInt(unlockingEras) * (_STAKING_ERA_LENGTH_MAP[chainInfo.slug] || _STAKING_ERA_LENGTH_MAP.default); // in hours

    if (substrateApi.api.query.nominationPools) {
      const nominationPoolSlug = `${poolInfo.slug.slice(0, 3)}___nomination_pool`;

      // eslint-disable-next-line node/no-callback-literal
      callback({ // TODO
        ...YIELD_POOLS_INFO[nominationPoolSlug],
        stats: {
          assetEarning: [
            {
              slug: _getChainNativeTokenSlug(chainInfo),
              apy: expectedReturn
            }
          ],
          maxCandidatePerFarmer: parseInt(maxNominations),
          maxWithdrawalRequestPerFarmer: parseInt(maxUnlockingChunks),
          minJoinPool: minPoolJoin || '0',
          minWithdrawal: '0',
          totalApy: expectedReturn,
          tvl: bnTotalEraStake.toString()
        },
        metadata: {
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
        } as ChainStakingMetadata
      });
    }
  });
}

export async function generatePathForNativeStaking (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
  const bnAmount = new BN(params.amount);
  const result: OptimalYieldPath = {
    totalFee: [],
    steps: [DEFAULT_YIELD_FIRST_STEP]
  };

  const feeAsset = params.poolInfo.feeAssets[0];
  const substrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;

  if (params.poolInfo.type === YieldPoolType.NATIVE_STAKING) {
    // TODO: check existing position
    result.steps.push({
      id: result.steps.length,
      name: 'Nominate validators',
      type: YieldStepType.NOMINATE
    });

    const [_bondFeeInfo, _nominateFeeInfo] = await Promise.all([
      substrateApi.api.tx.staking.bond(bnAmount, 'Staked').paymentInfo(fakeAddress),
      substrateApi.api.tx.staking.nominate(syntheticSelectedValidators).paymentInfo(fakeAddress)
    ]);

    const bondFeeInfo = _bondFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;
    const nominateFeeInfo = _nominateFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

    const totalFee = bondFeeInfo.partialFee + nominateFeeInfo.partialFee;

    result.totalFee.push({
      slug: feeAsset,
      amount: totalFee.toString()
    });
  } else {
    // TODO: check existing position
    result.steps.push({
      id: result.steps.length,
      metadata: {
        amount: params.amount
      },
      name: 'Join nomination pool',
      type: YieldStepType.JOIN_NOMINATION_POOL
    });

    const _joinPoolFeeInfo = await substrateApi.api.tx.nominationPools.join(params.amount, 1).paymentInfo(fakeAddress);
    const joinPoolFeeInfo = _joinPoolFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

    result.totalFee.push({
      slug: feeAsset,
      amount: joinPoolFeeInfo.partialFee.toString()
    });
  }

  return result;
}

export async function getNominationPoolJoinExtrinsic (address: string, params: OptimalYieldPathParams, inputData: SubmitJoinNominationPool) {
  const poolInfo = params.poolInfo;
  const substrateApi = params.substrateApiMap[poolInfo.chain];

  return await getPoolingBondingExtrinsic(substrateApi, inputData.amount, inputData.selectedPool.id, inputData.nominatorMetadata);
}

export async function getNativeStakingBondExtrinsic (address: string, params: OptimalYieldPathParams, inputData: SubmitJoinNativeStaking) {
  const poolInfo = params.poolInfo;
  const substrateApi = params.substrateApiMap[poolInfo.chain];
  const chainInfo = params.chainInfoMap[poolInfo.chain];

  return await getRelayBondingExtrinsic(substrateApi, inputData.amount, inputData.selectedValidators, chainInfo, address, inputData.nominatorMetadata);
}

export function getNativeStakingPosition (substrateApi: _SubstrateApi, useAddresses: string[], chainInfo: _ChainInfo, poolInfo: YieldPoolInfo, positionCallback: (rs: YieldPositionInfo) => void) {
  const nativeTokenSlug = _getChainNativeTokenSlug(chainInfo);

  return substrateApi.api.query.staking?.ledger.multi(useAddresses, async (ledgers: Codec[]) => {
    if (ledgers) {
      await Promise.all(ledgers.map(async (_ledger: Codec, i) => {
        const owner = reformatAddress(useAddresses[i], 42);
        const ledger = _ledger.toPrimitive() as unknown as PalletStakingStakingLedger;

        if (ledger) {
          const _activeBalance = ledger.active.toString();

          const nominatorMetadata = await subscribeRelayChainNominatorMetadata(chainInfo, owner, substrateApi, ledger);

          positionCallback({
            type: YieldPoolType.NATIVE_STAKING,
            balance: [
              {
                slug: nativeTokenSlug,
                activeBalance: _activeBalance
              }
            ],
            address: owner,
            chain: poolInfo.chain,
            metadata: nominatorMetadata,
            slug: poolInfo.slug
          });
        }
      }));
    }
  });
}

export function getNominationPoolPosition (substrateApi: _SubstrateApi, useAddresses: string[], chainInfo: _ChainInfo, poolInfo: YieldPoolInfo, positionCallback: (rs: YieldPositionInfo) => void) {
  const nativeTokenSlug = _getChainNativeTokenSlug(chainInfo);

  return substrateApi.api.query?.nominationPools?.poolMembers.multi(useAddresses, async (ledgers: Codec[]) => {
    if (ledgers) {
      await Promise.all(ledgers.map(async (_poolMemberInfo, i) => {
        const poolMemberInfo = _poolMemberInfo.toPrimitive() as unknown as PalletNominationPoolsPoolMember;
        const owner = reformatAddress(useAddresses[i], 42);

        if (poolMemberInfo) {
          const bondedBalance = poolMemberInfo.points;
          const unbondedBalance = poolMemberInfo.unbondingEras;

          let unlockingBalance = new BN(0);
          const bnBondedBalance = new BN(bondedBalance.toString());

          Object.entries(unbondedBalance).forEach(([, value]) => {
            const bnUnbondedBalance = new BN(value.toString());

            unlockingBalance = unlockingBalance.add(bnUnbondedBalance);
          });

          // const totalBalance = bnBondedBalance.add(unlockingBalance);
          const nominatorMetadata = await subscribeRelayChainPoolMemberMetadata(chainInfo, owner, substrateApi, poolMemberInfo);

          positionCallback({
            type: YieldPoolType.NOMINATION_POOL,
            balance: [
              {
                slug: nativeTokenSlug,
                activeBalance: bnBondedBalance.toString()
              }
            ],
            address: owner,
            chain: poolInfo.chain,
            metadata: nominatorMetadata,
            slug: poolInfo.slug
          });
        } else {
          positionCallback({
            type: YieldPoolType.NOMINATION_POOL,
            balance: [
              {
                slug: nativeTokenSlug,
                activeBalance: '0'
              }
            ],
            address: owner,
            chain: poolInfo.chain,
            metadata: {
              chain: poolInfo.chain,
              type: StakingType.POOLED,
              address: owner,
              status: EarningStatus.NOT_STAKING,
              activeStake: '0',
              nominations: [], // can only join 1 pool at a time
              unstakings: []
            } as NominatorMetadata,
            slug: poolInfo.slug
          });
        }
      }));
    }
  });
}
