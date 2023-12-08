// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo } from '../../info';
import { OptimalYieldPath, YieldStepDetail } from './step';
import { SubmitYieldJoinData } from './submit';

export interface ValidateYieldProcessParams {
  yieldPoolInfo: YieldPoolInfo,
  path: OptimalYieldPath;
  address: string;
  amount: string;
  data?: SubmitYieldJoinData;
}

export enum YieldValidationStatus {
  NOT_ENOUGH_FEE = 'NOT_ENOUGH_FEE',
  NOT_ENOUGH_BALANCE = 'NOT_ENOUGH_BALANCE',
  NOT_ENOUGH_MIN_JOIN_POOL = 'NOT_ENOUGH_MIN_JOIN_POOL',
  OK = 'OK'
}

export interface YieldProcessValidation {
  ok: boolean,
  status: YieldValidationStatus,
  failedStep?: YieldStepDetail,
  message?: string
}
