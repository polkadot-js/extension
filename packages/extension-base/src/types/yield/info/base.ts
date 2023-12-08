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
 * @enum {string}
 * @description The groups of yield pools.
 * */
export enum YieldPoolGroup {
  /** Polkadot */
  DOT = 'DOT',

  /** Kusama */
  KSM = 'KSM',

  /** Other */
  OTHER = 'OTHER'
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

