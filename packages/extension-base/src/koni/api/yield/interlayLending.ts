// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { OptimalPathResp, OptimalYieldPathParams, YieldPoolInfo, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { fakeAddress, RuntimeDispatchInfo } from '@subwallet/extension-base/koni/api/yield/utils';

import { BN, BN_ZERO } from '@polkadot/util';

export function subscribeInterlayLendingStats (poolInfo: YieldPoolInfo, callback: (rs: YieldPoolInfo) => void) {
  function getPoolStat () {
    // eslint-disable-next-line node/no-callback-literal
    callback({
      ...poolInfo,
      stats: {
        assetEarning: [
          {
            slug: poolInfo.inputAssets[0],
            apr: 18.38
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '10000000000',
        minWithdrawal: '0',
        totalApr: 18.38,
        tvl: '13095111106588368'
      }
    });
  }

  // eslint-disable-next-line node/no-callback-literal
  callback({
    ...poolInfo,
    stats: {
      assetEarning: [
        {
          slug: poolInfo.inputAssets[0],
          apr: 18.38
        }
      ],
      maxCandidatePerFarmer: 1,
      maxWithdrawalRequestPerFarmer: 1,
      minJoinPool: '10000000000',
      minWithdrawal: '0',
      totalApr: 18.38,
      tvl: '13095111106588368'
    }
  });

  const interval = setInterval(getPoolStat, 30000);

  return () => {
    clearInterval(interval);
  };
}

export async function generatePathForInterlayLending (params: OptimalYieldPathParams): Promise<OptimalPathResp> {
  const bnAmount = new BN(params.amount);
  const result: OptimalPathResp = {
    totalFee: [],
    steps: []
  };

  const inputTokenSlug = params.poolInfo.inputAssets[0]; // assume that the pool only has 1 input token, will update later
  const inputTokenInfo = params.assetInfoMap[inputTokenSlug];

  const inputTokenBalance = params.balanceMap[inputTokenSlug]?.free || '0';
  const bnInputTokenBalance = new BN(inputTokenBalance);

  const feeTokenSlug = params.poolInfo.feeAssets[0];

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
          slug: inputTokenSlug,
          amount: xcmFeeInfo.partialFee.toString()
        });
      }
    }
  }

  result.steps.push({
    name: 'Mint qDOT',
    type: YieldStepType.MINT_QDOT
  });

  const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.loans.mint({ Token: 'DOT' }, params.amount).paymentInfo(fakeAddress);
  const mintFeeInfo = _mintFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

  result.totalFee.push({
    slug: feeTokenSlug,
    amount: mintFeeInfo.partialFee.toString()
  });

  return result;
}
