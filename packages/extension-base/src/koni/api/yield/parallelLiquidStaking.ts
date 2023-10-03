// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicType, OptimalYieldPath, OptimalYieldPathParams, RequestCrossChainTransfer, RequestYieldStepSubmit, SubmitYieldStepData, YieldPoolInfo, YieldPositionInfo, YieldPositionStats, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { calculateAlternativeFee, DEFAULT_YIELD_FIRST_STEP, fakeAddress, RuntimeDispatchInfo } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug, _getTokenOnChainAssetId } from '@subwallet/extension-base/services/chain-service/utils';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN, BN_ZERO } from '@polkadot/util';

export function subscribeParallelLiquidStakingStats (chainApi: _SubstrateApi, chainInfoMap: Record<string, _ChainInfo>, poolInfo: YieldPoolInfo, callback: (rs: YieldPoolInfo) => void) {
  function getPoolStat () {
    // eslint-disable-next-line node/no-callback-literal
    callback({
      ...poolInfo,
      stats: {
        assetEarning: [
          {
            slug: poolInfo.rewardAssets[0],
            apr: 18.38
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '10000000000',
        minWithdrawal: '0',
        totalApr: 18.4,
        tvl: '13095111106588368'
      }
    });
  }

  getPoolStat();

  const interval = setInterval(getPoolStat, 3000000);

  return () => {
    clearInterval(interval);
  };
}

export function getParallelLiquidStakingPosition (substrateApi: _SubstrateApi, useAddresses: string[], chainInfo: _ChainInfo, poolInfo: YieldPoolInfo, assetInfoMap: Record<string, _ChainAsset>, positionCallback: (rs: YieldPositionInfo) => void) {
  // @ts-ignore
  const derivativeTokenSlug = poolInfo.derivativeAssets[0];
  const derivativeTokenInfo = assetInfoMap[derivativeTokenSlug];
  const inputTokenSlug = poolInfo.inputAssets[0];

  async function getStokenBalance () {
    const balances = await substrateApi.api.query.assets.account.multi(useAddresses.map((address) => [_getTokenOnChainAssetId(derivativeTokenInfo), address]));

    let totalBalance = new BN(0);

    balances.forEach((b) => {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
      const bdata = b?.toHuman();

      if (bdata) {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
        const addressBalance = new BN(String(bdata?.balance).replaceAll(',', '') || '0');

        // @ts-ignore
        totalBalance = totalBalance.add(addressBalance);
      }
    });

    if (totalBalance.gt(BN_ZERO)) {
      positionCallback({
        slug: poolInfo.slug,
        chain: chainInfo.slug,
        address: useAddresses[0], // TODO
        balance: [
          {
            slug: inputTokenSlug, // token slug
            totalBalance: totalBalance.toString(),
            activeBalance: totalBalance.toString()
          }
        ],

        metadata: {
          rewards: [],
          exchangeRate: 1
        } as YieldPositionStats
      } as YieldPositionInfo);
    }
  }

  function getPositionInterval () {
    getStokenBalance().catch(console.error);
  }

  getPositionInterval();

  const interval = setInterval(getPositionInterval, 30000);

  return () => {
    clearInterval(interval);
  };
}

export async function generatePathForParallelLiquidStaking (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
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
  const defaultFeeTokenBalance = params.balanceMap[defaultFeeTokenSlug]?.free || '0';
  const bnDefaultFeeTokenBalance = new BN(defaultFeeTokenBalance);

  const canPayFeeWithInputToken = params.poolInfo.feeAssets.includes(inputTokenSlug); // TODO

  const poolOriginSubstrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;

  if (!bnInputTokenBalance.gte(bnAmount)) {
    if (params.poolInfo.altInputAssets) {
      const remainingAmount = bnAmount.sub(bnInputTokenBalance);

      const altInputTokenSlug = params.poolInfo.altInputAssets[0];
      const altInputTokenInfo = params.assetInfoMap[altInputTokenSlug];

      const altInputTokenBalance = params.balanceMap[altInputTokenSlug]?.free || '0';
      const bnAltInputTokenBalance = new BN(altInputTokenBalance);

      if (bnAltInputTokenBalance.gt(BN_ZERO)) {
        const xcmAmount = bnAltInputTokenBalance.sub(remainingAmount);

        result.steps.push({
          id: result.steps.length,
          metadata: {
            sendingValue: xcmAmount.toString(),
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
    name: 'Mint sDOT',
    type: YieldStepType.MINT_SDOT
  });

  const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.liquidStaking.stake(params.amount).paymentInfo(fakeAddress);
  const mintFeeInfo = _mintFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

  if (bnDefaultFeeTokenBalance.gte(BN_ZERO)) {
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

export async function getParallelLiquidStakingExtrinsic (address: string, params: OptimalYieldPathParams, path: OptimalYieldPath, currentStep: number, requestData: RequestYieldStepSubmit) {
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
  const extrinsic = substrateApi.api.tx.liquidStaking.stake(inputData.amount);

  return {
    txChain: params.poolInfo.chain,
    extrinsicType: ExtrinsicType.MINT_SDOT,
    extrinsic,
    txData: inputData,
    transferNativeAmount: '0'
  };
}

export async function getParallelLiquidStakingRedeem (params: OptimalYieldPathParams, amount: string, address: string): Promise<[ExtrinsicType, SubmittableExtrinsic<'promise'>]> {
  const substrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;
  // const rewardTokenSlug = params.poolInfo.derivativeAssets[0];
  // const rewardTokenInfo = params.assetInfoMap[rewardTokenSlug];

  const extrinsic = substrateApi.api.tx.liquidStaking.fastMatchUnstake([address]);

  return [ExtrinsicType.REDEEM_SDOT, extrinsic];
}
