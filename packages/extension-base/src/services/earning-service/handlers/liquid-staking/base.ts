// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { LiquidYieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';

import BaseSpecialStakingPoolHandler from '../special';

export default abstract class BaseLiquidStakingPoolHandler extends BaseSpecialStakingPoolHandler {
  protected readonly type = YieldPoolType.LIQUID_STAKING;
  protected readonly minAmountPercent: number = 0.98;

  /* Subscribe pool info */

  abstract override getPoolStat (): Promise<LiquidYieldPoolInfo>;

  /* Subscribe pool info */
}
