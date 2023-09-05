// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { OptimalYieldPathParams, OptimalPathResp, YieldAssetExpectedEarning, YieldCompoundingPeriod, YieldPoolInfo, YieldPoolType, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { calculateChainStakedReturn, calculateInflation } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { YIELD_POOLS_INFO } from '@subwallet/extension-base/koni/api/yield/data';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';

import { Codec } from '@polkadot/types/types';
import { BN } from '@polkadot/util';

// only apply for DOT right now, will need to scale up

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

export async function generateOptimalPath (params: OptimalYieldPathParams): Promise<OptimalPathResp | undefined> { // assume inputs are already validated
  if (['DOT___native_staking', 'DOT___nomination_pool'].includes(params.poolInfo.slug)) {
    return await generatePathForNativeStaking(params);
  }

  return undefined;
}

const syntheticSelectedValidators = [
  '15MLn9YQaHZ4GMkhK3qXqR5iGGSdULyJ995ctjeBgFRseyi6',
  '1REAJ1k691g5Eqqg9gL7vvZCBG7FCCZ8zgQkZWd4va5ESih',
  '1yGJ3h7TQuJWLYSsUVPZbM8aR8UsQXCqMvrFx5Fn1ktiAmq',
  '16GDRhRYxk42paoK6TfHAqWej8PdDDUwdDazjv4bAn4KGNeb',
  '13Ybj8CPEArUee78DxUAP9yX3ABmFNVQME1ZH4w8HVncHGzc',
  '14yx4vPAACZRhoDQm1dyvXD3QdRQyCRRCe5tj1zPomhhS29a',
  '14Vh8S1DzzycngbAB9vqEgPFR9JpSvmF1ezihTUES1EaHAV',
  '153YD8ZHD9dRh82U419bSCB5SzWhbdAFzjj4NtA5pMazR2yC',
  '1LUckyocmz9YzeQZHVpBvYYRGXb3rnSm2tvfz79h3G3JDgP',
  '14oRE62MB1SWR6h5RTx3GY5HK2oZipi1Gp3zdiLwVYLfEyRZ',
  '1cFsLn7o74nmjbRyDtMAnMpQMc5ZLsjgCSz9Np2mcejUK83',
  '15ZvLonEseaWZNy8LDkXXj3Y8bmAjxCjwvpy4pXWSL4nGSBs',
  '1NebF2xZHb4TJJpiqZZ3reeTo8dZov6LZ49qZqcHHbsmHfo',
  '1HmAqbBRrWvsqbLkvpiVDkdA2PcctUE5JUe3qokEh1FN455',
  '15tfUt4iQNjMyhZiJGBf4EpETE2KqtW1nfJwbBT1MvWjvcK9',
  '12RXTLiaYh59PokjZVhQvKzcfBEB5CvDnjKKUmDUotzcTH3S'
];

export async function generatePathForNativeStaking (params: OptimalYieldPathParams): Promise<OptimalPathResp | undefined> {
  const bnAmount = new BN(params.amount);
  const result: OptimalPathResp = {
    totalFee: [],
    steps: []
  };

  const inputTokenSlug = params.poolInfo.inputAssets[0]; // assume that the pool only has 1 input token, will update later
  const inputTokenBalance = params.balanceMap[inputTokenSlug].free;
  const bnInputTokenBalance = new BN(inputTokenBalance);
  const substrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;

  if (bnInputTokenBalance.gte(bnAmount)) {
    if (params.poolInfo.type === YieldPoolType.NATIVE_STAKING) {
      result.steps.push({
        metadata: {
          amount: params.amount
        },
        name: 'Bond token',
        type: YieldStepType.BOND
      });
      result.steps.push({
        name: 'Nominate validators',
        type: YieldStepType.NOMINATE
      });

      const [bondFeeInfo, nominateFeeInfo] = await Promise.all([
        substrateApi.api.tx.staking.bond(bnAmount, 'Staked').paymentInfo('15MLn9YQaHZ4GMkhK3qXqR5iGGSdULyJ995ctjeBgFRseyi6'),
        substrateApi.api.tx.staking.nominate(syntheticSelectedValidators).paymentInfo('15MLn9YQaHZ4GMkhK3qXqR5iGGSdULyJ995ctjeBgFRseyi6')
      ]);

      console.log(bondFeeInfo.toPrimitive(), nominateFeeInfo.toPrimitive());
    } else {
      result.steps.push({
        metadata: {
          amount: params.amount
        },
        name: 'Join nomination pool',
        type: YieldStepType.JOIN_NOMINATION_POOL
      });
    }

    return result;
  }

  return undefined;
}
