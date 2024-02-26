// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { OptimalSwapPath, OptimalSwapPathParams, SwapStepType } from '@subwallet/extension-base/types/swap';
import { OptimalYieldPath, OptimalYieldPathParams, YieldStepType } from '@subwallet/extension-base/types/yield';

/* ServiceWithProcess */
export type OptimalProcessParams = OptimalYieldPathParams | OptimalSwapPathParams;
export type OptimalProcessResult = OptimalYieldPath | OptimalSwapPath;

export type BaseStepType = SwapStepType | YieldStepType;

export interface BaseStepDetail {
  type: BaseStepType;
  name: string;
  metadata?: Record<string, unknown>;
}
