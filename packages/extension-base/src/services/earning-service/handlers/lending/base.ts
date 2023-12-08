// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { LendingYieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';

import BaseSpecialStakingPoolHandler from '../special';

export default abstract class BaseLendingPoolHandler extends BaseSpecialStakingPoolHandler {
  protected readonly type = YieldPoolType.LENDING;

  /* Subscribe pool info */

  abstract override getPoolStat (): Promise<LendingYieldPoolInfo>;

  /* Subscribe pool info */
}
