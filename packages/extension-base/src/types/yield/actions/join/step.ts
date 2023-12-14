// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolTarget } from '@subwallet/extension-base/types';

/**
 * @interface OptimalYieldPathParams
 * @description Params to generate steps
 * */
export interface OptimalYieldPathParams {
  slug: string;
  address: string;
  amount: string;
  targets?: YieldPoolTarget[];
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
 * @prop {string} name - Step's name
 * @prop {YieldStepType} type - Step's type
 * @prop {Record<string,unknown>} [metadata] - Metadata for generating extrinsic
 * */
export interface BaseYieldStepDetail {
  /** Step's name */
  name: string;
  /** Step's type */
  type: YieldStepType;
  /** Metadata for generating extrinsic */
  metadata?: Record<string, unknown>;
}

/**
 * @interface YieldStepDetail
 * @extends BaseYieldStepDetail
 * @description Detail of a step
 * @prop {number} id - Step's id
 * */
export interface YieldStepDetail extends BaseYieldStepDetail {
  /** Step's id */
  id: number;
}

/**
 * @interface YieldTokenBaseInfo
 * @prop {string} slug - Token's slug
 * @prop {string} [amount] - Token's amount
 * */
export interface YieldTokenBaseInfo {
  /** Token's slug */
  slug: string;
  /** Token's amount */
  amount?: string;
}

/** Base info and fee of a step */
export type YieldStepBaseInfo = [BaseYieldStepDetail, YieldTokenBaseInfo]

/**
 * @interface OptimalYieldPath
 * @description Result after generate steps
 * */
export interface OptimalYieldPath {
  totalFee: YieldTokenBaseInfo[],
  steps: YieldStepDetail[],
  connectionError?: string
}

export type GenStepFunction = (params: OptimalYieldPathParams) => Promise<YieldStepBaseInfo | undefined>;
