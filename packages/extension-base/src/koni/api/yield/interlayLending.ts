// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicType, OptimalYieldPath, OptimalYieldPathParams, RequestCrossChainTransfer, RequestYieldStepSubmit, SubmitYieldStepData, TokenBalanceRaw, YieldPoolInfo, YieldPositionInfo, YieldPositionStats, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { YIELD_POOL_STAT_REFRESH_INTERVAL } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { HandleYieldStepData } from '@subwallet/extension-base/koni/api/yield/index';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug, _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { sumBN } from '@subwallet/extension-base/utils';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN } from '@polkadot/util';

export function subscribeInterlayLendingStats (chainApi: _SubstrateApi, chainInfoMap: Record<string, _ChainInfo>, poolInfo: YieldPoolInfo, assetInfoMap: Record<string, _ChainAsset>, callback: (rs: YieldPoolInfo) => void) {
  async function getPoolStat () {
    const substrateApi = await chainApi.isReady;
    const inputTokenSlug = poolInfo.inputAssets[0];
    const inputTokenInfo = assetInfoMap[inputTokenSlug];

    const _exchangeRate = await substrateApi.api.query.loans.exchangeRate(_getTokenOnChainInfo(inputTokenInfo));

    const exchangeRate = _exchangeRate.toPrimitive() as number;
    const decimals = 10 ** 18;

    // eslint-disable-next-line node/no-callback-literal
    callback({
      ...poolInfo,
      stats: {
        assetEarning: [
          {
            slug: poolInfo.rewardAssets[0],
            apr: 1.29,
            exchangeRate: exchangeRate / decimals
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '10000000000',
        minWithdrawal: '0',
        totalApr: 1.29,
        tvl: '291890000000000'
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

export function getInterlayLendingPosition (substrateApi: _SubstrateApi, useAddresses: string[], chainInfo: _ChainInfo, poolInfo: YieldPoolInfo, assetInfoMap: Record<string, _ChainAsset>, positionCallback: (rs: YieldPositionInfo) => void) {
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

export async function getInterlayLendingExtrinsic (address: string, params: OptimalYieldPathParams, path: OptimalYieldPath, currentStep: number, requestData: RequestYieldStepSubmit, balanceService: BalanceService): Promise<HandleYieldStepData> {
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
  const inputTokenSlug = params.poolInfo.inputAssets[0];
  const inputTokenInfo = params.assetInfoMap[inputTokenSlug];
  const extrinsic = substrateApi.api.tx.loans.mint(_getTokenOnChainInfo(inputTokenInfo), inputData.amount);

  return {
    txChain: params.poolInfo.chain,
    extrinsicType: ExtrinsicType.MINT_QDOT,
    extrinsic,
    txData: requestData,
    transferNativeAmount: '0'
  };
}

export async function getInterlayLendingRedeem (params: OptimalYieldPathParams, amount: string, yieldPositionInfo: YieldPositionInfo): Promise<[ExtrinsicType, SubmittableExtrinsic<'promise'>]> {
  const substrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;
  // @ts-ignore
  const inputTokenSlug = params.poolInfo.inputAssets[0];
  const inputTokenInfo = params.assetInfoMap[inputTokenSlug];

  const bnAmount = new BN(amount);
  const bnActiveBalance = new BN(yieldPositionInfo.balance[0].totalBalance);

  const redeemAll = bnAmount.eq(bnActiveBalance);

  const extrinsic = !redeemAll
    ? substrateApi.api.tx.loans.redeem(_getTokenOnChainInfo(inputTokenInfo), amount)
    : substrateApi.api.tx.loans.redeemAll(_getTokenOnChainInfo(inputTokenInfo));

  return [ExtrinsicType.REDEEM_QDOT, extrinsic];
}
