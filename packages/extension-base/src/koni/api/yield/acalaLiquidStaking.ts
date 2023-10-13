// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicType, OptimalYieldPath, OptimalYieldPathParams, RequestCrossChainTransfer, RequestYieldStepSubmit, SubmitYieldStepData, TokenBalanceRaw, YieldPoolInfo, YieldPositionInfo, YieldPositionStats, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { YIELD_POOL_STAT_REFRESH_INTERVAL } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { HandleYieldStepData } from '@subwallet/extension-base/koni/api/yield/index';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug, _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { sumBN } from '@subwallet/extension-base/utils';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN } from '@polkadot/util';

const YEAR = 365 * 24 * 60 * 60 * 1000;

export async function subscribeAcalaLiquidStakingStats (chainApi: _SubstrateApi, chainInfoMap: Record<string, _ChainInfo>, poolInfo: YieldPoolInfo, callback: (rs: YieldPoolInfo) => void) {
  const substrateApi = await chainApi.isReady;

  const [_toBondPool, _totalStakingBonded] = await Promise.all([
    substrateApi.api.query.homa.toBondPool(),
    substrateApi.api.query.homa.totalStakingBonded()
  ]);

  const toBondPool = new BN(_toBondPool.toString());
  const totalStakingBonded = new BN(_totalStakingBonded.toString());

  function getPoolStat () {
    // eslint-disable-next-line node/no-callback-literal
    callback({
      ...poolInfo,
      stats: {
        assetEarning: [
          {
            slug: poolInfo.rewardAssets[0],
            apr: 20.86,
            exchangeRate: 1
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '50000000000',
        minWithdrawal: '0',
        totalApr: 20.86,
        tvl: totalStakingBonded.add(toBondPool).toString()
      }
    });
  }

  getPoolStat();

  const interval = setInterval(getPoolStat, YIELD_POOL_STAT_REFRESH_INTERVAL);

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

    const totalBalance = sumBN(balances.map((b) => (b.free || new BN(0))));

    positionCallback({
      slug: poolInfo.slug,
      chain: chainInfo.slug,
      address: useAddresses.length > 1 ? ALL_ACCOUNT_KEY : useAddresses[0], // TODO
      balance: [
        {
          slug: derivativeTokenSlug, // token slug
          totalBalance: totalBalance.toString(),
          activeBalance: totalBalance.toString()
        }
      ],

      metadata: {
        rewards: []
      } as YieldPositionStats
    } as YieldPositionInfo);
  });
}

export async function getAcalaLiquidStakingExtrinsic (address: string, params: OptimalYieldPathParams, path: OptimalYieldPath, currentStep: number, requestData: RequestYieldStepSubmit): Promise<HandleYieldStepData> {
  const inputData = requestData.data as SubmitYieldStepData;

  if (path.steps[currentStep].type === YieldStepType.XCM) {
    const destinationTokenSlug = params.poolInfo.inputAssets[0];
    const originChainInfo = params.chainInfoMap[COMMON_CHAIN_SLUGS.POLKADOT];
    const originTokenSlug = _getChainNativeTokenSlug(originChainInfo);
    const originTokenInfo = params.assetInfoMap[originTokenSlug];
    const destinationTokenInfo = params.assetInfoMap[destinationTokenSlug];
    const substrateApi = params.substrateApiMap[originChainInfo.slug];

    const xcmFee = path.totalFee[currentStep].amount || '0';
    const bnXcmFee = new BN(xcmFee);
    const bnAmount = new BN(inputData.amount);

    const bnTotalAmount = bnAmount.add(bnXcmFee);

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
    0 // should always set a min target to prevent unexpected result
  );

  return [ExtrinsicType.REDEEM_LDOT, extrinsic];
}
