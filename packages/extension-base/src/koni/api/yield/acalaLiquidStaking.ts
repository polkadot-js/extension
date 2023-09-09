// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { OptimalYieldPath, OptimalYieldPathParams, YieldPoolInfo, YieldProcessValidation, YieldStepType, YieldValidationStatus } from '@subwallet/extension-base/background/KoniTypes';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { calculateAlternativeFee, DEFAULT_YIELD_FIRST_STEP, fakeAddress, RuntimeDispatchInfo } from '@subwallet/extension-base/koni/api/yield/utils';

import { BN, BN_ZERO } from '@polkadot/util';

export function subscribeAcalaLiquidStakingStats (poolInfo: YieldPoolInfo, callback: (rs: YieldPoolInfo) => void) {
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

  const interval = setInterval(getPoolStat, 3000000);

  return () => {
    clearInterval(interval);
  };
}

export async function generatePathForAcalaLiquidStaking (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
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
    name: 'Mint LDOT',
    type: YieldStepType.MINT_LDOT
  });

  const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.homa.mint(params.amount).paymentInfo(fakeAddress);
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

export function validateProcessForAcalaLiquidStaking (params: OptimalYieldPathParams, path: OptimalYieldPath): YieldProcessValidation {
  const result: YieldProcessValidation = {
    ok: true,
    status: YieldValidationStatus.OK
  };

  const bnAmount = new BN(params.amount);
  const inputTokenSlug = params.poolInfo.inputAssets[0]; // TODO
  const bnInputTokenBalance = new BN(params.balanceMap[inputTokenSlug]?.free || '0');

  if (path.steps[0].type === YieldStepType.XCM && params.poolInfo.altInputAssets) { // if xcm
    const missingAmount = bnAmount.sub(bnInputTokenBalance); // TODO: what if input token is not LOCAL ??
    const xcmFee = new BN(path.totalFee[0].amount || '0');
    const xcmAmount = missingAmount.add(xcmFee);

    const altInputTokenSlug = params.poolInfo.altInputAssets[0];
    const bnAltInputTokenBalance = new BN(params.balanceMap[altInputTokenSlug]?.free || '0');
    const altInputTokenMinAmount = new BN(params.assetInfoMap[altInputTokenSlug].minAmount || '0');

    if (!bnAltInputTokenBalance.sub(xcmAmount).gte(altInputTokenMinAmount)) {
      result.failedStep = path.steps[0];
      result.ok = false;
      result.status = YieldValidationStatus.NOT_ENOUGH_MIN_AMOUNT;

      return result;
    }
  }

  const submitStep = path.steps[0].type === YieldStepType.XCM ? path.steps[1] : path.steps[0];
  const feeTokenSlug = path.totalFee[submitStep.id].slug;
  const defaultFeeTokenSlug = params.poolInfo.feeAssets[0];

  if (feeTokenSlug === defaultFeeTokenSlug) {
    const bnFeeAmount = new BN(path.totalFee[submitStep.id]?.amount || '0');
    const bnFeeTokenBalance = new BN(params.balanceMap[feeTokenSlug]?.free || '0');
    const bnFeeTokenMinAmount = new BN(params.assetInfoMap[feeTokenSlug]?.minAmount || '0');

    if (!bnFeeTokenBalance.sub(bnFeeAmount).gte(bnFeeTokenMinAmount)) {
      result.failedStep = path.steps[submitStep.id];
      result.ok = false;
      result.status = YieldValidationStatus.NOT_ENOUGH_FEE;

      return result;
    }

    if (!bnAmount.gte(new BN(params.poolInfo.stats?.minJoinPool || '0'))) {
      result.failedStep = path.steps[submitStep.id];
      result.ok = false;
      result.status = YieldValidationStatus.NOT_ENOUGH_MIN_AMOUNT;

      return result;
    }
  } else {
    const bnFeeAmount = new BN(path.totalFee[submitStep.id]?.amount || '0');

    // paying fee with input token
    if (!bnAmount.sub(bnFeeAmount).gte(new BN(params.poolInfo.stats?.minJoinPool || '0'))) {
      result.failedStep = path.steps[submitStep.id];
      result.ok = false;
      result.status = YieldValidationStatus.NOT_ENOUGH_MIN_AMOUNT;

      return result;
    }
  }

  return result;
}
