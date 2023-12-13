// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicType, NominatorMetadata, OptimalYieldPath, OptimalYieldPathParams, RequestCrossChainTransfer, RequestYieldStepSubmit, StakingStatus, StakingType, SubmitYieldStepData, UnbondingSubmitParams, YieldPoolInfo, YieldPoolType, YieldPositionInfo, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { convertDerivativeToOriginToken, YIELD_POOL_MIN_AMOUNT_PERCENT, YIELD_POOL_STAT_REFRESH_INTERVAL } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { HandleYieldStepData } from '@subwallet/extension-base/koni/api/yield/index';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug, _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { TokenBalanceRaw } from '@subwallet/extension-base/types';
import fetch from 'cross-fetch';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN, BN_ZERO } from '@polkadot/util';

// const YEAR = 365 * 24 * 60 * 60 * 1000;

const GRAPHQL_API = 'https://api.polkawallet.io/acala-liquid-staking-subql';
const EXCHANGE_RATE_REQUEST = 'query { dailySummaries(first:30, orderBy:TIMESTAMP_DESC) {nodes { exchangeRate timestamp }}}';

interface BifrostLiquidStakingMeta {
  data: {
    dailySummaries: {
      nodes: BifrostLiquidStakingMetaItem[]
    }
  }
}

interface BifrostLiquidStakingMetaItem {
  exchangeRate: string,
  timestamp: string
}

export function subscribeAcalaLiquidStakingStats (chainApi: _SubstrateApi, chainInfoMap: Record<string, _ChainInfo>, poolInfo: YieldPoolInfo, callback: (rs: YieldPoolInfo) => void) {
  async function getPoolStat () {
    const substrateApi = await chainApi.isReady;

    const stakingMetaPromise = new Promise(function (resolve) {
      fetch(GRAPHQL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: EXCHANGE_RATE_REQUEST
        })
      }).then((res) => {
        resolve(res.json());
      }).catch(console.error);
    });

    const [_toBondPool, _totalStakingBonded, _stakingMeta] = await Promise.all([
      substrateApi.api.query.homa.toBondPool(),
      substrateApi.api.query.homa.totalStakingBonded(),
      stakingMetaPromise
    ]);

    const stakingMeta = _stakingMeta as BifrostLiquidStakingMeta;
    const stakingMetaList = stakingMeta.data.dailySummaries.nodes;
    const latestExchangeRate = parseInt(stakingMetaList[0].exchangeRate);
    const decimals = 10 ** 10;

    const endingBalance = parseInt(stakingMetaList[0].exchangeRate);
    const beginBalance = parseInt(stakingMetaList[29].exchangeRate);

    const diff = endingBalance / beginBalance;
    const apy = diff ** (365 / 30) - 1;

    const toBondPool = new BN(_toBondPool.toString());
    const totalStakingBonded = new BN(_totalStakingBonded.toString());

    // eslint-disable-next-line node/no-callback-literal
    callback({
      ...poolInfo,
      stats: {
        assetEarning: [
          {
            slug: poolInfo.rewardAssets[0],
            apy: apy * 100,
            exchangeRate: latestExchangeRate / decimals
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '50000000000',
        minWithdrawal: '50000000000',
        totalApy: apy * 100,
        tvl: totalStakingBonded.add(toBondPool).toString()
      }
    });
  }

  function getStatInterval () {
    getPoolStat().catch(console.error);
  }

  getStatInterval();

  const interval = setInterval(getStatInterval, YIELD_POOL_STAT_REFRESH_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

export function subscribeAcalaLcDOTLiquidStakingStats (chainApi: _SubstrateApi, chainInfoMap: Record<string, _ChainInfo>, poolInfo: YieldPoolInfo, callback: (rs: YieldPoolInfo) => void) {
  function getPoolStat () {
    // eslint-disable-next-line node/no-callback-literal
    callback({
      ...poolInfo,
      stats: {
        assetEarning: [
          {
            slug: poolInfo.rewardAssets[0],
            apr: 232.45,
            exchangeRate: 1 / 7.46544
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '50000000000',
        minWithdrawal: '0',
        totalApr: 232.45,
        tvl: '6579642367262479'
      }
    });
  }

  function getStatInterval () {
    getPoolStat();
  }

  getStatInterval();

  const interval = setInterval(getStatInterval, YIELD_POOL_STAT_REFRESH_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

export function getAcalaLiquidStakingPosition (substrateApi: _SubstrateApi, useAddresses: string[], chainInfo: _ChainInfo, poolInfo: YieldPoolInfo, assetInfoMap: Record<string, _ChainAsset>, positionCallback: (rs: YieldPositionInfo) => void) {
  // @ts-ignore
  const derivativeTokenSlug = poolInfo.derivativeAssets[0];
  const derivativeTokenInfo = assetInfoMap[derivativeTokenSlug];

  return substrateApi.api.query.tokens.accounts.multi(useAddresses.map((address) => [address, _getTokenOnChainInfo(derivativeTokenInfo)]), (_balances) => {
    const balances = _balances as unknown as TokenBalanceRaw[];

    for (let i = 0; i < balances.length; i++) {
      const balanceItem = balances[i];
      const address = useAddresses[i];
      const activeBalance = balanceItem.free || BN_ZERO;

      positionCallback({
        slug: poolInfo.slug,
        chain: chainInfo.slug,
        type: YieldPoolType.LIQUID_STAKING,
        address,
        balance: [
          {
            slug: derivativeTokenSlug, // token slug
            activeBalance: activeBalance.toString()
          }
        ],

        metadata: {
          chain: chainInfo.slug,
          type: StakingType.LIQUID_STAKING,

          status: StakingStatus.EARNING_REWARD,
          address,
          activeStake: activeBalance.toString(),
          nominations: [],
          unstakings: []
        } as NominatorMetadata
      } as YieldPositionInfo);
    }
  });
}

export async function getAcalaLiquidStakingExtrinsic (address: string, params: OptimalYieldPathParams, path: OptimalYieldPath, currentStep: number, requestData: RequestYieldStepSubmit, balanceService: BalanceService): Promise<HandleYieldStepData> {
  const inputData = requestData.data as SubmitYieldStepData;

  if (path.steps[currentStep].type === YieldStepType.XCM) {
    const destinationTokenSlug = params.poolInfo.inputAssets[0];
    const originChainInfo = params.chainInfoMap[COMMON_CHAIN_SLUGS.POLKADOT];
    const originTokenSlug = _getChainNativeTokenSlug(originChainInfo);
    const originTokenInfo = params.assetInfoMap[originTokenSlug];
    const destinationTokenInfo = params.assetInfoMap[destinationTokenSlug];
    const substrateApi = params.substrateApiMap[originChainInfo.slug];

    const inputTokenBalance = await balanceService.getTokenFreeBalance(params.address, destinationTokenInfo.originChain, destinationTokenSlug);
    const bnInputTokenBalance = new BN(inputTokenBalance.value);

    const xcmFee = path.totalFee[currentStep].amount || '0';
    const bnXcmFee = new BN(xcmFee);
    const bnAmount = new BN(inputData.amount);

    const bnTotalAmount = bnAmount.sub(bnInputTokenBalance).add(bnXcmFee);

    const extrinsic = await createXcmExtrinsic({
      chainInfoMap: params.chainInfoMap,
      destinationTokenInfo,
      originTokenInfo,
      recipient: address,
      sendingValue: bnTotalAmount.toString(),
      substrateApi
    });

    const xcmData: RequestCrossChainTransfer = {
      originNetworkKey: originChainInfo.slug,
      destinationNetworkKey: destinationTokenInfo.originChain,
      from: address,
      to: address,
      value: bnTotalAmount.toString(),
      tokenSlug: originTokenSlug,
      showExtraWarning: true
    };

    return {
      txChain: originChainInfo.slug,
      extrinsicType: ExtrinsicType.TRANSFER_XCM,
      extrinsic,
      txData: xcmData,
      transferNativeAmount: bnTotalAmount.toString()
    };
  }

  const substrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;
  const extrinsic = substrateApi.api.tx.homa.mint(inputData.amount);

  return {
    txChain: params.poolInfo.chain,
    extrinsicType: ExtrinsicType.MINT_LDOT,
    extrinsic,
    txData: requestData,
    transferNativeAmount: '0'
  };
}

export async function getAcalaLiquidStakingRedeem (params: OptimalYieldPathParams, amount: string): Promise<[ExtrinsicType, SubmittableExtrinsic<'promise'>]> {
  const substrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;

  const derivativeTokenSlug = params.poolInfo.derivativeAssets?.[0] || '';
  const originTokenSlug = params.poolInfo.inputAssets[0] || '';

  const derivativeTokenInfo = params.assetInfoMap[derivativeTokenSlug];
  const originTokenInfo = params.assetInfoMap[originTokenSlug];

  const formattedMinAmount = convertDerivativeToOriginToken(amount, params.poolInfo, derivativeTokenInfo, originTokenInfo);
  const weightedMinAmount = Math.floor(YIELD_POOL_MIN_AMOUNT_PERCENT[params.poolInfo.slug] * formattedMinAmount);

  const extrinsic = substrateApi.api.tx.aggregatedDex.swapWithExactSupply(
    // Swap path
    [
      {
        Taiga: [
          0, /* pool id */
          1, /* supply asset */
          0 /* target asset */
        ]
      }
    ],
    // Supply amount
    amount,
    // Min target amount
    weightedMinAmount // should always set a min target to prevent unexpected result
  );

  return [ExtrinsicType.REDEEM_LDOT, extrinsic];
}

export async function getAcalaLiquidStakingDefaultUnstake (params: UnbondingSubmitParams, substrateApi: _SubstrateApi): Promise<SubmittableExtrinsic<'promise'>> {
  const chainApi = await substrateApi.isReady;

  return chainApi.api.tx.homa.requestRedeem(params.amount, false);
}

export async function getAcalaLiquidStakingDefaultWithdraw (nominatorMetadata: NominatorMetadata, substrateApi: _SubstrateApi): Promise<SubmittableExtrinsic<'promise'>> {
  const chainApi = await substrateApi.isReady;

  return chainApi.api.tx.homa.claimRedemption(nominatorMetadata.address);
}
