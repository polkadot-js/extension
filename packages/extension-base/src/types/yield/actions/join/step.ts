// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

export interface RuntimeDispatchInfo {
  weight: {
    refTime: number,
    proofSize: number
  },
  class: string,
  partialFee: number
}

/**
 * @interface OptimalYieldPathParams
 * @description Params to generate steps
 * */
export interface OptimalYieldPathParams {
  slug: string;
  address: string;
  amount: string;
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
 * @interface BaseYieldStepDetail
 * @description Base info of a step
 * */
export interface BaseYieldStepDetail {
  name: string,
  type: YieldStepType,
  metadata?: Record<string, unknown>; // for generating extrinsic
}

/**
 * @interface YieldStepDetail
 * @extends BaseYieldStepDetail
 * @description Detail of a step
 * */
export interface YieldStepDetail extends BaseYieldStepDetail {
  id: number,
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
