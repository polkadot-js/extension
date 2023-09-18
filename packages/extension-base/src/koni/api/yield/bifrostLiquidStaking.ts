// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainAsset } from '@subwallet/chain-list/types';
import { ExtrinsicType, OptimalYieldPath, OptimalYieldPathParams, SubmitBifrostLiquidStaking, YieldPoolInfo, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { calculateAlternativeFee, DEFAULT_YIELD_FIRST_STEP, fakeAddress, RuntimeDispatchInfo } from '@subwallet/extension-base/koni/api/yield/utils';
import { _getAssetDecimals, _getChainNativeTokenSlug, _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import fetch from 'cross-fetch';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN, BN_ZERO } from '@polkadot/util';

const STATS_URL = 'https://api.bifrost.app/api/site';

export interface BifrostLiquidStakingMeta {
  apy: string,
  apyBase: string,
  apyReward: string,
  tvl: number,
  tvm: number,
  holders: number
}

export function subscribeBifrostLiquidStakingStats (poolInfo: YieldPoolInfo, assetInfoMap: Record<string, _ChainAsset>, callback: (rs: YieldPoolInfo) => void) {
  async function getPoolStat () {
    const response = await fetch(STATS_URL, {
      method: 'GET'
    })
      .then((res) => res.json()) as Record<string, BifrostLiquidStakingMeta>;

    const vDOTStats = response.vDOT;
    const assetInfo = assetInfoMap[poolInfo.inputAssets[0]];
    const assetDecimals = 10 ** _getAssetDecimals(assetInfo);

    // eslint-disable-next-line node/no-callback-literal
    callback({
      ...poolInfo,
      stats: {
        assetEarning: [
          {
            slug: poolInfo.inputAssets[0],
            apy: parseFloat(vDOTStats.apyBase) / 100
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

  fetch(STATS_URL, {
    method: 'GET'
  })
    .then((res) => {
      res.json()
        .then((data: Record<string, BifrostLiquidStakingMeta>) => {
          const vDOTStats = data.vDOT;
          const assetInfo = assetInfoMap[poolInfo.inputAssets[0]];
          const assetDecimals = 10 ** _getAssetDecimals(assetInfo);

          // eslint-disable-next-line node/no-callback-literal
          callback({
            ...poolInfo,
            stats: {
              assetEarning: [
                {
                  slug: poolInfo.inputAssets[0],
                  apy: parseFloat(vDOTStats.apyBase) / 100
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
        })
        .catch(console.error);
    })
    .catch(console.error);

  const interval = setInterval(getStatInterval, 30000);

  return () => {
    clearInterval(interval);
  };
}

export async function generatePathForBifrostLiquidStaking (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
  const bnAmount = new BN(params.amount);
  const result: OptimalYieldPath = {
    totalFee: [],
    steps: [DEFAULT_YIELD_FIRST_STEP]
  };

  const inputTokenSlug = params.poolInfo.inputAssets[0]; // assume that the pool only has 1 input token, will update later
  const inputTokenInfo = params.assetInfoMap[inputTokenSlug];

  const inputTokenBalance = params.balanceMap[inputTokenSlug]?.free || '0';
  const bnInputTokenBalance = new BN(inputTokenBalance);

  const defaultFeeTokenSlug = params.poolInfo.feeAssets[0];
  const defaultFeeTokenBalance = params.balanceMap[defaultFeeTokenSlug]?.free || '0';
  const bnDefaultFeeTokenBalance = new BN(defaultFeeTokenBalance);

  const canPayFeeWithInputToken = params.poolInfo.feeAssets.includes(inputTokenSlug); // TODO

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

  const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.vtokenMinting.mint({ VToken: 'DOT' }, params.amount).paymentInfo(fakeAddress);
  const mintFeeInfo = _mintFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

  if (bnDefaultFeeTokenBalance.gt(BN_ZERO)) {
    result.totalFee.push({
      slug: defaultFeeTokenSlug,
      amount: mintFeeInfo.partialFee.toString()
    });
  } else {
    if (canPayFeeWithInputToken) {
      result.totalFee.push({
        slug: inputTokenSlug, // TODO
        amount: calculateAlternativeFee(mintFeeInfo).toString()
      });
    }
  }

  return result;
}

export async function getBifrostLiquidStakingExtrinsic (address: string, params: OptimalYieldPathParams, path: OptimalYieldPath, currentStep: number, inputData: SubmitBifrostLiquidStaking): Promise<[ExtrinsicType, SubmittableExtrinsic<'promise'>]> {
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

    return [ExtrinsicType.TRANSFER_XCM, extrinsic];
  }

  const substrateApi = params.substrateApiMap[params.poolInfo.chain];
  const inputTokenSlug = params.poolInfo.inputAssets[0];
  const inputTokenInfo = params.assetInfoMap[inputTokenSlug];
  const extrinsic = substrateApi.api.tx.vtokenMinting.mint(_getTokenOnChainInfo(inputTokenInfo), inputData.amount);

  return [ExtrinsicType.MINT_VDOT, extrinsic];
}

export function getBifrostLiquidStakingRedeem (params: OptimalYieldPathParams, amount: string) {
  const rewardTokenSlug = params.poolInfo.rewardAssets[0];
  const rewardTokenInfo = params.assetInfoMap[rewardTokenSlug];
  const substrateApi = params.substrateApiMap[params.poolInfo.chain];

  return substrateApi.api.tx.vtokenMinting.redeem(_getTokenOnChainInfo(rewardTokenInfo), amount);
}
