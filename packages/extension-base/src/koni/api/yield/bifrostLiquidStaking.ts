// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicType, OptimalYieldPath, OptimalYieldPathParams, RequestCrossChainTransfer, RequestYieldStepSubmit, SubmitYieldStepData, TokenBalanceRaw, YieldPoolInfo, YieldPositionInfo, YieldPositionStats, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { DEFAULT_YIELD_FIRST_STEP, fakeAddress, RuntimeDispatchInfo } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { HandleYieldStepData } from '@subwallet/extension-base/koni/api/yield/index';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getAssetDecimals, _getChainNativeTokenSlug, _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { sumBN } from '@subwallet/extension-base/utils';
import fetch from 'cross-fetch';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN, BN_ZERO } from '@polkadot/util';

const STATS_URL = 'https://api.bifrost.app/api/site';
const BIFROST_GRAPHQL_ENDPOINT = 'https://bifrost-subsql.liebi.com/v1/graphql';
const BIFROST_EXCHANGE_RATE_REQUEST = 'query MyQuery{slp_polkadot_ratio(limit:1 where:{key:{_eq:"0"}} order_by:{timestamp:desc_nulls_first}){ratio key timestamp total_issuance token_pool}}';

export interface BifrostLiquidStakingMeta {
  apy: string,
  apyBase: string,
  apyReward: string,
  tvl: number,
  tvm: number,
  holders: number
}

export interface BifrostVtokenExchangeRateResp {
  data: {
    slp_polkadot_ratio: BifrostVtokenExchangeRate[]
  }
}

export interface BifrostVtokenExchangeRate {
  ratio: string,
  key: string,
  timestamp: string,
  total_issuance: number,
  token_pool: number
}

export function subscribeBifrostLiquidStakingStats (poolInfo: YieldPoolInfo, assetInfoMap: Record<string, _ChainAsset>, callback: (rs: YieldPoolInfo) => void) {
  async function getPoolStat () {
    const stakingMetaPromise = new Promise(function (resolve) {
      fetch(STATS_URL, {
        method: 'GET'
      }).then((res) => {
        resolve(res.json());
      }).catch(console.error);
    });

    const exchangeRatePromise = new Promise(function (resolve) {
      fetch(BIFROST_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: BIFROST_EXCHANGE_RATE_REQUEST
        })
      }).then((resp) => {
        resolve(resp.json());
      }).catch(console.error);
    });

    const [_stakingMeta, _exchangeRate] = await Promise.all([
      stakingMetaPromise,
      exchangeRatePromise
    ]);

    const stakingMeta = _stakingMeta as Record<string, BifrostLiquidStakingMeta>;
    const exchangeRate = _exchangeRate as BifrostVtokenExchangeRateResp;

    const vDOTStats = stakingMeta.vDOT;
    const assetInfo = assetInfoMap[poolInfo.inputAssets[0]];
    const assetDecimals = 10 ** _getAssetDecimals(assetInfo);

    // eslint-disable-next-line node/no-callback-literal
    callback({
      ...poolInfo,
      stats: {
        assetEarning: [
          {
            slug: poolInfo.rewardAssets[0],
            apy: parseFloat(vDOTStats.apyBase) / 100,
            exchangeRate: parseFloat(exchangeRate.data.slp_polkadot_ratio[0].ratio)
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '0',
        minWithdrawal: '0',
        totalApy: parseFloat(vDOTStats.apyBase) / 100,
        tvl: (vDOTStats.tvm * assetDecimals).toString()
      }
    });
  }

  function getStatInterval () {
    getPoolStat().catch(console.error);
  }

  getStatInterval();

  const interval = setInterval(getStatInterval, 300000);

  return () => {
    clearInterval(interval);
  };
}

export function getBifrostLiquidStakingPosition (substrateApi: _SubstrateApi, useAddresses: string[], chainInfo: _ChainInfo, poolInfo: YieldPoolInfo, assetInfoMap: Record<string, _ChainAsset>, positionCallback: (rs: YieldPositionInfo) => void, initialExchangeRate?: number) {
  // @ts-ignore
  const derivativeTokenSlug = poolInfo.derivativeAssets[0];
  const inputTokenSlug = poolInfo.inputAssets[0];
  const derivativeTokenInfo = assetInfoMap[derivativeTokenSlug];

  async function getVtokenBalance () {
    const balancePromise = substrateApi.api.query.tokens.accounts.multi(useAddresses.map((address) => [address, _getTokenOnChainInfo(derivativeTokenInfo)]));
    const exchangeRatePromise = new Promise(function (resolve) {
      fetch(BIFROST_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: BIFROST_EXCHANGE_RATE_REQUEST
        })
      }).then((resp) => {
        resolve(resp.json());
      }).catch(console.error);
    });

    const [_balances, _exchangeRate] = await Promise.all([
      balancePromise,
      exchangeRatePromise
    ]);

    const balances = _balances as unknown as TokenBalanceRaw[];
    const exchangeRateInfo = _exchangeRate as BifrostVtokenExchangeRateResp;

    const totalBalance = sumBN(balances.map((b) => (b.free || new BN(0))));
    const exchangeRate = parseFloat(exchangeRateInfo.data.slp_polkadot_ratio[0].ratio);

    const inputTokenBalance = Math.floor(totalBalance.toNumber() * exchangeRate);

    if (totalBalance.gt(BN_ZERO)) {
      positionCallback({
        slug: poolInfo.slug,
        chain: chainInfo.slug,
        address: useAddresses[0], // TODO
        balance: [
          {
            slug: inputTokenSlug, // token slug
            totalBalance: inputTokenBalance.toString(),
            activeBalance: inputTokenBalance.toString()
          }
        ],

        metadata: {
          rewards: [
            {
              slug: inputTokenSlug
            }
          ],
          initialExchangeRate
        } as YieldPositionStats
      } as YieldPositionInfo);
    }
  }

  function getPositionInterval () {
    getVtokenBalance().catch(console.error);
  }

  getPositionInterval();

  const interval = setInterval(getPositionInterval, 30000);

  return () => {
    clearInterval(interval);
  };
}

export async function generatePathForBifrostLiquidStaking (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
  const bnAmount = new BN(params.amount);
  const result: OptimalYieldPath = {
    totalFee: [{ slug: '' }],
    steps: [DEFAULT_YIELD_FIRST_STEP]
  };

  const inputTokenSlug = params.poolInfo.inputAssets[0]; // assume that the pool only has 1 input token, will update later
  const inputTokenInfo = params.assetInfoMap[inputTokenSlug];

  const inputTokenBalance = params.balanceMap[inputTokenSlug]?.free || '0';
  const bnInputTokenBalance = new BN(inputTokenBalance);

  const defaultFeeTokenSlug = params.poolInfo.feeAssets[0];
  // const defaultFeeTokenBalance = params.balanceMap[defaultFeeTokenSlug]?.free || '0';
  // const bnDefaultFeeTokenBalance = new BN(defaultFeeTokenBalance);

  // const canPayFeeWithInputToken = params.poolInfo.feeAssets.includes(inputTokenSlug); // TODO

  const poolOriginSubstrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;

  if (!bnInputTokenBalance.gte(bnAmount)) {
    if (params.poolInfo.altInputAssets) {
      const altInputTokenSlug = params.poolInfo.altInputAssets[0];
      const altInputTokenInfo = params.assetInfoMap[altInputTokenSlug];

      const altInputTokenBalance = params.balanceMap[altInputTokenSlug]?.free || '0';
      const bnAltInputTokenBalance = new BN(altInputTokenBalance);

      if (bnAltInputTokenBalance.gt(BN_ZERO)) {
        result.steps.push({
          id: result.steps.length,
          metadata: {
            sendingValue: bnAmount.toString(),
            originTokenInfo: altInputTokenInfo,
            destinationTokenInfo: inputTokenInfo
          },
          name: 'Transfer DOT from Polkadot',
          type: YieldStepType.XCM
        });

        const xcmOriginSubstrateApi = await params.substrateApiMap[altInputTokenInfo.originChain].isReady;

        const xcmTransfer = await createXcmExtrinsic({
          originTokenInfo: altInputTokenInfo,
          destinationTokenInfo: inputTokenInfo,
          sendingValue: bnAmount.toString(),
          recipient: fakeAddress,
          chainInfoMap: params.chainInfoMap,
          substrateApi: xcmOriginSubstrateApi
        });

        const _xcmFeeInfo = await xcmTransfer.paymentInfo(fakeAddress);
        const xcmFeeInfo = _xcmFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;
        // TODO: calculate fee for destination chain

        result.totalFee.push({
          slug: altInputTokenSlug,
          amount: xcmFeeInfo.partialFee.toString()
        });
      }
    }
  }

  result.steps.push({
    id: result.steps.length,
    name: 'Mint vDOT',
    type: YieldStepType.MINT_VDOT
  });

  const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.vtokenMinting.mint({ VToken: 'DOT' }, params.amount, null).paymentInfo(fakeAddress);
  const mintFeeInfo = _mintFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

  result.totalFee.push({
    slug: defaultFeeTokenSlug,
    amount: mintFeeInfo.partialFee.toString()
  });

  // if (bnDefaultFeeTokenBalance.gt(BN_ZERO)) {
  // } else {
  //   if (canPayFeeWithInputToken) {
  //     result.totalFee.push({
  //       slug: inputTokenSlug, // TODO
  //       amount: calculateAlternativeFee(mintFeeInfo).toString()
  //     });
  //   }
  // }

  return result;
}

export async function getBifrostLiquidStakingExtrinsic (address: string, params: OptimalYieldPathParams, path: OptimalYieldPath, currentStep: number, requestData: RequestYieldStepSubmit): Promise<HandleYieldStepData> {
  const inputData = requestData.data as SubmitYieldStepData;

  if (path.steps[currentStep].type === YieldStepType.XCM) {
    const destinationTokenSlug = params.poolInfo.inputAssets[0];
    const originChainInfo = params.chainInfoMap[COMMON_CHAIN_SLUGS.POLKADOT];
    const originTokenSlug = _getChainNativeTokenSlug(originChainInfo);
    const originTokenInfo = params.assetInfoMap[originTokenSlug];
    const destinationTokenInfo = params.assetInfoMap[destinationTokenSlug];
    const substrateApi = params.substrateApiMap[originChainInfo.slug];

    const extrinsic = await createXcmExtrinsic({
      chainInfoMap: params.chainInfoMap,
      destinationTokenInfo,
      originTokenInfo,
      recipient: address,
      sendingValue: inputData.amount,
      substrateApi
    });

    const xcmData: RequestCrossChainTransfer = {
      originNetworkKey: originChainInfo.slug,
      destinationNetworkKey: destinationTokenInfo.originChain,
      from: address,
      to: address,
      value: inputData.amount,
      tokenSlug: originTokenSlug,
      showExtraWarning: true
    };

    return {
      txChain: originChainInfo.slug,
      extrinsicType: ExtrinsicType.TRANSFER_XCM,
      extrinsic,
      txData: xcmData,
      transferNativeAmount: inputData.amount
    };
  }

  const substrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;
  const inputTokenSlug = params.poolInfo.inputAssets[0];
  const inputTokenInfo = params.assetInfoMap[inputTokenSlug];
  const extrinsic = substrateApi.api.tx.vtokenMinting.mint(_getTokenOnChainInfo(inputTokenInfo), inputData.amount, undefined);

  return {
    txChain: params.poolInfo.chain,
    extrinsicType: ExtrinsicType.MINT_VDOT,
    extrinsic,
    txData: requestData,
    transferNativeAmount: '0'
  };
}

export async function getBifrostLiquidStakingRedeem (params: OptimalYieldPathParams, amount: string): Promise<[ExtrinsicType, SubmittableExtrinsic<'promise'>]> {
  const substrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;
  // @ts-ignore
  const rewardTokenSlug = params.poolInfo.derivativeAssets[0];
  const rewardTokenInfo = params.assetInfoMap[rewardTokenSlug];

  const extrinsic = substrateApi.api.tx.vtokenMinting.redeem(_getTokenOnChainInfo(rewardTokenInfo), amount);

  return [ExtrinsicType.REDEEM_VDOT, extrinsic];
}
