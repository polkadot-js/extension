// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo } from '../../info';
import { OptimalYieldPath } from './step';
import { SubmitYieldJoinData } from './submit';

export interface ValidateYieldProcessParams {
  yieldPoolInfo: YieldPoolInfo,
  path: OptimalYieldPath;
  address: string;
  amount: string;
  data?: SubmitYieldJoinData;
}
