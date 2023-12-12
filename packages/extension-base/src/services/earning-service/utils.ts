// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0


import { YieldAssetExpectedEarning, YieldCompoundingPeriod } from '@subwallet/extension-base/types';

export function calculateReward (apr: number, amount = 0, compoundingPeriod = YieldCompoundingPeriod.YEARLY, isApy = false): YieldAssetExpectedEarning {
  if (!apr) {
    return {};
  }

  if (!isApy) {
    const periodApr = apr / 365 * compoundingPeriod; // APR is always annually
    const earningRatio = (periodApr / 100) / compoundingPeriod;

    const periodApy = (1 + earningRatio) ** compoundingPeriod - 1;

    const reward = periodApy * amount;

    return {
      apy: periodApy * 100,
      rewardInToken: reward
    };
  } else {
    const reward = (apr / 100) * amount;

    return {
      apy: apr,
      rewardInToken: reward * (compoundingPeriod / YieldCompoundingPeriod.YEARLY)
    };
  }
}
