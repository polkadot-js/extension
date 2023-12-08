// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolGroup, YieldPoolType } from '../base';

/**
 * @interface YieldAssetEarningStats
 * @prop {string} slug - Token's slug
 * @prop {number} [apr] - Token's apr
 * @prop {number} [apy] - Token's apy
 * @prop {number} [exchangeRate] - Token's exchangeRate
 * */
export interface YieldAssetEarningStats {
  /** Token's slug */
  slug: string;

  /** Token's apr */
  apr?: number;

  /** Token's apy */
  apy?: number;

  /**
   * @description Token's exchangeRate
   * @example input token amount = reward token amount * exchange rate
   * */
  exchangeRate?: number;
}

/**
 * @interface YieldPoolMetadata
 * @prop {boolean} isAvailable - Is the pool available?
 * @prop {number} maxCandidatePerFarmer - Max candidate per farmer
 * @prop {number} maxWithdrawalRequestPerFarmer - Max withdrawal request per farmer
 * @prop {string} minJoinPool - Min amount to join pool
 * @prop {number} [farmerCount] - Total farmer
 * @prop {number} [era] - Current era of network
 * @prop {YieldAssetEarningStats[]} assetEarning - Info for asset earning
 * @prop {string} [tvl] - Total value staked in pool
 * @prop {number} [totalApy] - Total apy of earning assets
 * @prop {number} [totalApr] - Total apr of earning assets
 * @prop {number} [unstakingPeriod] - Time to wait withdraw un-stake, in hour
 * @prop {boolean} allowCancelUnstaking - Allow to cancel un-stake
 * @prop {number} [inflation] - Inflation rate
 * @prop {string} minWithdrawal - Min amount for withdrawal request
 * */
export interface YieldPoolMetadata {
  /* Common info */

  /** Is the pool available? */
  isAvailable: boolean;

  /** Max candidate per farmer  */
  maxCandidatePerFarmer: number; // like maxValidatorPerNominator with native staking

  /** Max withdrawal request per farmer  */
  maxWithdrawalRequestPerFarmer: number; // like maxWithdrawalRequestPerValidator with native staking

  /** Min amount to join pool */
  minJoinPool: string;

  /** Total farmer */
  farmerCount?: number;

  /** Current era of network */
  era?: number; // also round for parachains

  /** Info for asset earning */
  assetEarning: YieldAssetEarningStats[]; // TODO: Special for type

  /** Total value staked in pool */
  tvl?: string; // in token

  /** Total apy of earning assets */
  totalApy?: number;

  /** Total apr of earning assets */
  totalApr?: number;

  /* Common info */

  /* Special info */

  /** Time to wait withdraw un-stake, in hour */
  unstakingPeriod?: number; // for normal un-stake (not fast un-stake)

  /** Allow to cancel un-stake */
  allowCancelUnstaking: boolean; // for native staking

  /** Inflation rate */
  inflation?: number; // in %, annually

  /** Min amount for withdrawal request */
  minWithdrawal: string;

  /* Special info */
}

/**
 * @interface AbstractYieldPoolInfo
 * @prop {string} slug - Pool's slug
 * @prop {string} chain - Pool's chain
 * @prop {string} type - Pool's type
 * @prop {string} group - Pool's group (by token)
 * @prop {string} description - Pool's description
 * @prop {string} name - Pool's name
 * @prop {string} [logo] - Pool's logo
 * @prop {YieldPoolMetadata} metadata - Pool's metadata
 * */
export interface AbstractYieldPoolInfo {
  /* Common info */

  /** Pool's slug */
  slug: string;

  /** Pool's chain */
  chain: string;

  /** Pool's type */
  type: YieldPoolType;

  /** Pool's group (by token) */
  group: YieldPoolGroup;

  /** Pool's description */
  description: string;

  /** Pool's name */
  name: string;

  /** Pool's logo - optional */
  logo?: string;

  /* Common info */

  /* Special info */

  /** Pool's metadata */
  metadata: YieldPoolMetadata;

  /* Special info */
}

/**
 * @interface SpecialYieldPoolInfo
 * @extends AbstractYieldPoolInfo
 * @prop {string[]} derivativeAssets - Array of derivative tokens (slug)
 * @prop {string} inputAsset - Input token (slug)
 * @prop {string[]} rewardAssets - Array of reward tokens (slug)
 * @prop {string[]} feeAssets - Array of fee tokens (slug)
 * @prop {string} [altInputAssets] - Alt input token (slug) - optional
 * */
export interface SpecialYieldPoolInfo extends AbstractYieldPoolInfo {
  /* Special info */

  /** Array of derivative tokens (slug) */
  derivativeAssets?: string[];

  /** Input token (slug) */
  inputAsset: string; // slug

  /** Array of reward tokens (slug) */
  rewardAssets: string[]; // slug

  /** Alt input token (slug) - optional */
  altInputAssets?: string; // TODO

  /** Array of fee tokens (slug) */
  feeAssets: string[],

  /* Special info */
}

/**
 * @interface LiquidYieldPoolInfo
 * @extends SpecialYieldPoolInfo
 * @prop {YieldPoolType.LIQUID_STAKING} type - Pool's type
 * */
export interface LiquidYieldPoolInfo extends SpecialYieldPoolInfo {
  type: YieldPoolType.LIQUID_STAKING;
}

/**
 * @interface LendingYieldPoolInfo
 * @extends SpecialYieldPoolInfo
 * @prop {YieldPoolType.LENDING} type - Pool's type
 * */
export interface LendingYieldPoolInfo extends SpecialYieldPoolInfo {
  type: YieldPoolType.LENDING;
}

/**
 * @interface NormalYieldPoolInfo
 * @extends AbstractYieldPoolInfo
 * @prop {Exclude<YieldPoolType,YieldPoolType.LIQUID_STAKING|YieldPoolType.LENDING>} type - Pool's type
 * */
export interface NormalYieldPoolInfo extends AbstractYieldPoolInfo {
  type: Exclude<YieldPoolType, YieldPoolType.LIQUID_STAKING | YieldPoolType.LENDING>;
}

/**
 * Info of yield pool
 * */
export type YieldPoolInfo = NormalYieldPoolInfo | LiquidYieldPoolInfo | LendingYieldPoolInfo;
