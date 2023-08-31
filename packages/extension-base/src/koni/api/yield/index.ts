// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { YieldAssetExpectedEarning, YieldCompoundingPeriod, YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';
import { calculateChainStakedReturn, calculateInflation } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { YIELD_POOLS_INFO } from '@subwallet/extension-base/koni/api/yield/data';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';

import { Codec } from '@polkadot/types/types';
import { BN } from '@polkadot/util';

// only apply for DOT right now, will need to scale up

export function getYieldPools (): YieldPoolInfo[] {
  return Object.values(YIELD_POOLS_INFO);
}

export function subscribeYieldPoolStats (substrateApiMap: Record<string, _SubstrateApi>, chainInfoMap: Record<string, _ChainInfo>, callback: (rs: YieldPoolInfo) => void) {
  const unsubList: VoidFunction[] = [];

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  Object.values(YIELD_POOLS_INFO).forEach(async (poolInfo) => {
    const substrateApi = await substrateApiMap[poolInfo.chain].isReady;
    const chainInfo = chainInfoMap[poolInfo.chain];

    if (YieldPoolType.NATIVE_STAKING === poolInfo.type) {
      const unsub = await subscribeNativeStakingYieldStats(poolInfo, substrateApi, chainInfo, callback);

      // @ts-ignore
      unsubList.push(unsub);
    }
  });

  return () => {
    unsubList.forEach((unsub) => {
      unsub && unsub();
    });
  };
}

export function subscribeNativeStakingYieldStats (poolInfo: YieldPoolInfo, substrateApi: _SubstrateApi, chainInfo: _ChainInfo, callback: (rs: YieldPoolInfo) => void) {
  return substrateApi.api.query.staking.currentEra(async (_currentEra: Codec) => {
    const currentEra = _currentEra.toString();
    const maxNominations = substrateApi.api.consts.staking.maxNominations.toString();
    const maxUnlockingChunks = substrateApi.api.consts.staking.maxUnlockingChunks.toString();

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

    // eslint-disable-next-line node/no-callback-literal
    callback({
      ...poolInfo,
      stats: {
        assetEarning: [
          {
            slug: _getChainNativeTokenSlug(chainInfo),
            apr: expectedReturn
          }
        ],
        maxCandidatePerFarmer: parseInt(maxNominations),
        maxWithdrawalRequestPerFarmer: parseInt(maxUnlockingChunks),
        minJoinPool: minStake.toString(),
        minWithdrawal: '0',
        totalApr: expectedReturn,
        tvl: bnTotalEraStake.toString()
      }
    });

    // eslint-disable-next-line node/no-callback-literal
    callback({ // TODO
      ...YIELD_POOLS_INFO.DOT___nomination_pool,
      stats: {
        assetEarning: [
          {
            slug: _getChainNativeTokenSlug(chainInfo),
            apr: expectedReturn
          }
        ],
        maxCandidatePerFarmer: parseInt(maxNominations),
        maxWithdrawalRequestPerFarmer: parseInt(maxUnlockingChunks),
        minJoinPool: minPoolJoin || '0',
        minWithdrawal: '0',
        totalApr: expectedReturn,
        tvl: bnTotalEraStake.toString()
      }
    });
  });
}

export function calculateReward (apr: number, amount = 0, compoundingPeriod = YieldCompoundingPeriod.YEARLY): YieldAssetExpectedEarning {
  if (!apr) {
    return {};
  }

  const periodApr = apr / 365 * compoundingPeriod; // APR is always annually

  const earningRatio = (periodApr / 100) / compoundingPeriod;
  const periodApy = (1 + earningRatio) ** compoundingPeriod - 1;

  const reward = periodApy * amount;

  return {
    apy: periodApy,
    rewardInToken: reward
  };
}
