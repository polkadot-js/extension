// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

/**
 * @enum {string}
 * @description The types of yield pool.
 * */
export enum YieldPoolType {
  /** Liquid staking */
  LIQUID_STAKING = 'LIQUID_STAKING',

  /** Lending */
  LENDING = 'LENDING',

  /** Single farming */
  SINGLE_FARMING = 'SINGLE_FARMING',

  /** Pool staking */
  NOMINATION_POOL = 'NOMINATION_POOL',

  /** Native staking */
  NATIVE_STAKING = 'NATIVE_STAKING',

  /** Parachain staking */
  PARACHAIN_STAKING = 'PARACHAIN_STAKING'
}

/**
 * @enum {number}
 * @description Time to calculate profit
 * */
export enum YieldCompoundingPeriod {
  DAILY = 1,
  WEEKLY = 7,
  MONTHLY = 30,
  YEARLY = 365
}

/**
 * @interface BasePoolInfo
 * @prop {string} slug - Pool's slug
 * @prop {string} chain - Pool's chain
 * @prop {string} type - Pool's type
 * @prop {string} group - Pool's group (by token)
 * */
export interface BasePoolInfo {
  /* Common info */

  /** Pool's slug */
  slug: string;

  /** Pool's chain */
  chain: string;

  /** Pool's type */
  type: YieldPoolType;

  /** Pool's group (by token) */
  group: string;
}
