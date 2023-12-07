// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo } from '../../info';

/**
 * @interface OptimalYieldPathRequest
 * @description Request to generate steps
 * */
export interface OptimalYieldPathRequest {
  address: string,
  amount: string,
  poolInfo: YieldPoolInfo
}

/**
 * @interface OptimalYieldPathParams
 * @description Params use on function to generate steps
 * */
export interface OptimalYieldPathParams {
  poolInfo: YieldPoolInfo,
  address: string,
  amount: string,
  hasPosition?: boolean
}

/**
 * @enum {string}
 * @description Type of join yield step
 * */

export enum YieldStepType {
  DEFAULT = 'DEFAULT',
  XCM = 'XCM',

  // native staking
  NOMINATE = 'NOMINATE',

  // nomination pool
  JOIN_NOMINATION_POOL = 'JOIN_NOMINATION_POOL',

  // bifrost
  MINT_VDOT = 'MINT_VDOT',

  // acala
  MINT_LDOT = 'MINT_LDOT',

  // interlay
  MINT_QDOT = 'MINT_QDOT',

  MINT_SDOT = 'MINT_SDOT',

  MINT_STDOT = 'MINT_STDOT',

  TOKEN_APPROVAL = 'TOKEN_APPROVAL'
}

/**
 * @interface YieldStepDetail
 * @description Detail of a step
 * */
export interface YieldStepDetail {
  id: number,
  name: string,
  type: YieldStepType,
  metadata?: Record<string, unknown>; // for generating extrinsic
}

/**
 * @interface YieldTokenBaseInfo
 * */
export interface YieldTokenBaseInfo {
  slug: string,
  amount?: string,
}

/**
 * @interface OptimalYieldPath
 * @description Result after generate steps
 * */
export interface OptimalYieldPath {
  totalFee: YieldTokenBaseInfo[],
  steps: YieldStepDetail[],
  connectionError?: string
}
