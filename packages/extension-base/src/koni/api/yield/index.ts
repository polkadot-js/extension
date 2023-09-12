// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { OptimalYieldPath, OptimalYieldPathParams, SubmitJoinNativeStaking, YieldAssetExpectedEarning, YieldCompoundingPeriod, YieldPoolInfo, YieldPoolType, YieldProcessValidation } from '@subwallet/extension-base/background/KoniTypes';
import { getRelayBondingExtrinsic } from '@subwallet/extension-base/koni/api/staking/bonding/relayChain';
import { generatePathForAcalaLiquidStaking, subscribeAcalaLiquidStakingStats, validateProcessForAcalaLiquidStaking } from '@subwallet/extension-base/koni/api/yield/acalaLiquidStaking';
import { generatePathForBifrostLiquidStaking, subscribeBifrostLiquidStakingStats } from '@subwallet/extension-base/koni/api/yield/bifrostLiquidStaking';
import { YIELD_POOLS_INFO } from '@subwallet/extension-base/koni/api/yield/data';
import { generatePathForInterlayLending, subscribeInterlayLendingStats } from '@subwallet/extension-base/koni/api/yield/interlayLending';
import { generatePathForNativeStaking, subscribeNativeStakingYieldStats } from '@subwallet/extension-base/koni/api/yield/nativeStaking';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';

// only apply for DOT right now, will need to scale up

export function subscribeYieldPoolStats (substrateApiMap: Record<string, _SubstrateApi>, chainInfoMap: Record<string, _ChainInfo>, callback: (rs: YieldPoolInfo) => void) {
  const unsubList: VoidFunction[] = [];

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  Object.values(YIELD_POOLS_INFO).forEach(async (poolInfo) => {
    if (!substrateApiMap[poolInfo.chain]) {
      return;
    }

    const substrateApi = await substrateApiMap[poolInfo.chain].isReady;
    const chainInfo = chainInfoMap[poolInfo.chain];

    if (YieldPoolType.NATIVE_STAKING === poolInfo.type) {
      const unsub = await subscribeNativeStakingYieldStats(poolInfo, substrateApi, chainInfo, callback);

      // @ts-ignore
      unsubList.push(unsub);
    } else if (poolInfo.slug === 'DOT___bifrost_liquid_staking') {
      const unsub = subscribeBifrostLiquidStakingStats(poolInfo, callback);

      // @ts-ignore
      unsubList.push(unsub);
    } else if (poolInfo.slug === 'DOT___acala_liquid_staking') {
      const unsub = subscribeAcalaLiquidStakingStats(poolInfo, callback);

      unsubList.push(unsub);
    } else if (poolInfo.slug === 'DOT___interlay_lending') {
      const unsub = subscribeInterlayLendingStats(poolInfo, callback);

      unsubList.push(unsub);
    }
  });

  return () => {
    unsubList.forEach((unsub) => {
      unsub && unsub();
    });
  };
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

export async function generateNaiveOptimalPath (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
  // 1. assume inputs are already validated
  // 2. generate paths based on amount only, not taking fee into account
  // 3. fees are calculated in the worst possible situation
  // 4. fees are calculated for the whole process, either user can pay all or nothing

  if (params.poolInfo.slug === 'DOT___bifrost_liquid_staking') {
    return generatePathForBifrostLiquidStaking(params);
  } else if (params.poolInfo.slug === 'DOT___acala_liquid_staking') {
    return generatePathForAcalaLiquidStaking(params);
  } else if (params.poolInfo.slug === 'DOT___interlay_lending') {
    return generatePathForInterlayLending(params);
  }

  return generatePathForNativeStaking(params);
}

export function validateProcess (params: OptimalYieldPathParams, path: OptimalYieldPath): YieldProcessValidation {
  // TODO: calculate token portion
  // TODO: compare to ED
  // TODO: compare to minAmount
  // TODO: simulate the whole process, compare to fee (step by step)

  if (['DOT___bifrost_liquid_staking', 'DOT___acala_liquid_staking'].includes(params.poolInfo.slug)) {
    return validateProcessForAcalaLiquidStaking(params, path);
  }
}

export async function getJoinPoolExtrinsic (address: string, params: OptimalYieldPathParams, data: unknown) {
  const inputData = data as SubmitJoinNativeStaking;
  const poolInfo = params.poolInfo;
  const substrateApi = params.substrateApiMap[poolInfo.chain];
  const chainInfo = params.chainInfoMap[poolInfo.chain];

  return await getRelayBondingExtrinsic(substrateApi, inputData.amount, inputData.selectedValidators, chainInfo, address);
}
