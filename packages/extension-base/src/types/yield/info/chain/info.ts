// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { BasePoolInfo, YieldPoolType } from '../base';

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
 * @interface YieldPoolMethodInfo
 * @prop {boolean} join - Pool can join
 * @prop {boolean} defaultUnstake - Pool can default unstake
 * @prop {boolean} fastUnstake - Pool can fast unstake
 * @prop {boolean} cancelUnstake - Pool can cancel unstake
 * @prop {boolean} withdraw - Pool can withdraw
 * @prop {boolean} claimReward - Pool can claim reward
 * */
export interface YieldPoolMethodInfo {
  /** Pool can join */
  join: boolean;

  /** Pool can default unstake */
  defaultUnstake: boolean;

  /** Pool can fast unstake */
  fastUnstake: boolean;

  /** Pool can cancel unstake */
  cancelUnstake: boolean;

  /** Pool can withdraw */
  withdraw: boolean;

  /** Pool can claim reward */
  claimReward: boolean;
}

/**
 * @interface YieldThresholdInfo
 * @prop {string} join - Min amount to join pool
 * @prop {string} defaultUnstake - Min amount to unstake from pool
 * @prop {string} fastUnstake - Min amount to fast unstake
 * */
export interface YieldThresholdInfo {
  join: string;
  defaultUnstake: string;
  fastUnstake: string;
}

/**
 * @interface BaseYieldPoolMetadata
 * @prop {string} description - Pool's description
 * @prop {string} name - Pool's name
 * @prop {string} shortName - Pool's short name
 * @prop {string} logo - Pool's logo
 * @prop {boolean} isAvailable - Is the pool available?
 * @prop {string} inputAsset - Input token (slug)
 * @prop {string} maintainAsset - Asset to maintain account's pool
 * @prop {string} maintainBalance - Balance to maintain account's pool
 * @prop {YieldPoolMethodInfo} availableMethod - Pool's available method
 * */
export interface BaseYieldPoolMetadata {
  /* Common info */

  /** Pool's description */
  description: string;

  /** Pool's name */
  name: string;

  /** Pool's short name */
  shortName: string;

  /** Pool's logo */
  logo: string;

  /** Input token (slug) */
  inputAsset: string;

  /** Is the pool available? */
  isAvailable: boolean;

  /* Common info */

  /* Special info */

  /** Asset to maintain account's pool */
  maintainAsset: string;

  /** Balance to maintain account's pool */
  maintainBalance: string;

  /** Pool's available method */
  availableMethod: YieldPoolMethodInfo;

  /* Special info */
}

/**
 * @interface NormalYieldPoolMetadata
 * @extends BaseYieldPoolMetadata
 * */
export type NormalYieldPoolMetadata = BaseYieldPoolMetadata

/**
 * @interface SpecialYieldPoolMetadata
 * @extends BaseYieldPoolMetadata
 * @prop {string[]} derivativeAssets - Array of derivative tokens (slug)
 * @prop {string[]} rewardAssets - Array of reward tokens (slug)
 * @prop {string[]} feeAssets - Array of fee tokens (slug)
 * @prop {string} [altInputAssets] - Alt input token (slug) - optional
 * */
export interface SpecialYieldPoolMetadata extends BaseYieldPoolMetadata {
  /* Special info */

  /** Array of derivative tokens (slug) */
  derivativeAssets: string[];

  /** Array of reward tokens (slug) */
  rewardAssets: string[]; // slug

  /** Alt input token (slug) - optional */
  altInputAssets?: string; // TODO

  /**
   * Array of fee tokens (slug)
   * <p>
   * If the pool has more than one token, the mint step can use input token for fee instead native token
   * </p>
   *  */
  feeAssets: string[],

  /* Special info */
}

/**
 * @description Required data
 * */
export type YieldPoolMetadata = NormalYieldPoolMetadata | SpecialYieldPoolMetadata;

/**
 * @interface BaseYieldPoolStatistic
 * @description Statistic data of pool
 * @prop {YieldAssetEarningStats[]} assetEarning - Info for asset earning
 * @prop {number} maxCandidatePerFarmer - Max candidates per farmer
 * @prop {number} maxWithdrawalRequestPerFarmer - Max withdrawal request per farmer
 * @prop {string} earningThreshold - Min amount to join pool
 * @prop {number} [farmerCount] - Total farmer
 * @prop {string} [tvl] - Total value staked in pool
 * @prop {number} [totalApy] - Total apy of earning assets
 * @prop {number} [totalApr] - Total apr of earning assets
 * */
export interface BaseYieldPoolStatistic {
  /* Common info */
  /** Info for asset earning */
  assetEarning: YieldAssetEarningStats[];

  /** Max candidate per farmer  */
  maxCandidatePerFarmer: number; // like maxValidatorPerNominator with native staking

  /** Max withdrawal request per farmer  */
  maxWithdrawalRequestPerFarmer: number; // like maxWithdrawalRequestPerValidator with native staking

  /** Min amount to join pool */
  earningThreshold: YieldThresholdInfo;

  /** Total farmer */
  farmerCount?: number;

  /** Total value staked in pool */
  tvl?: string; // in token

  /** Total apy of earning assets */
  totalApy?: number;

  /** Total apr of earning assets */
  totalApr?: number;

  /* Common info */
}

/**
 * @interface NormalYieldPoolStatistic
 * @extends BaseYieldPoolStatistic
 * @prop {number} era - Current era of network
 * @prop {number} eraTime - Time of an era - in hour
 * @prop {number} unstakingPeriod - Time to wait withdraw un-stake, in hour
 * @prop {number} [inflation] - Inflation rate
 * */
export interface NormalYieldPoolStatistic extends BaseYieldPoolStatistic {
  /* Special info */

  /** Current era of network */
  era: number; // also round for parachains

  /** Time of an era - in hour */
  eraTime: number; // also round for parachains

  /** Time to wait withdraw un-stake, in hour */
  unstakingPeriod: number; // for normal un-stake (not fast un-stake)

  /** Inflation rate */
  inflation?: number; // in %, annually

  /* Special info */
}

/**
 * @interface SpecialYieldPoolStatistic
 * @extends BaseYieldPoolStatistic
 * @prop {number} [unstakingPeriod] - Time to wait withdraw un-stake, in hour
 * */
export interface SpecialYieldPoolStatistic extends BaseYieldPoolStatistic {
  /* Special info */

  /** Time to wait withdraw un-stake, in hour */
  unstakingPeriod?: number; // for normal un-stake (not fast un-stake)

  /* Special info */
}

export type YieldPoolStatistic = NormalYieldPoolStatistic | SpecialYieldPoolStatistic;

/**
 * @interface AbstractYieldPoolInfo
 * @extends BasePoolInfo
 * @prop {string} description - Pool's description
 * @prop {string} name - Pool's name
 * @prop {string} shortName - Pool's short name
 * @prop {string} logo - Pool's logo
 * @prop {YieldPoolStatistic} [statistic] - Pool's metadata
 * */
export interface AbstractYieldPoolInfo extends BasePoolInfo {
  /* Common info */

  metadata: YieldPoolMetadata;

  /* Common info */

  /* Special info */

  /** Pool's metadata */
  statistic?: YieldPoolStatistic;

  lastUpdated?: number;

  /* Special info */
}

/**
 * @interface SpecialYieldPoolInfo
 * @extends AbstractYieldPoolInfo
 * @prop {SpecialYieldPoolStatistic} [statistic] - Pool's metadata
 * */
export interface SpecialYieldPoolInfo extends AbstractYieldPoolInfo {
  type: YieldPoolType.LIQUID_STAKING | YieldPoolType.LENDING;
  metadata: SpecialYieldPoolMetadata;
  statistic?: SpecialYieldPoolStatistic;
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
 * @interface NominationYieldPoolInfo
 * @extends AbstractYieldPoolInfo
 * @prop {YieldPoolType.NOMINATION_POOL} type - Pool's type
 * @prop {NormalYieldPoolStatistic} [statistic] - Pool's metadata
 * */
export interface NominationYieldPoolInfo extends AbstractYieldPoolInfo {
  type: YieldPoolType.NOMINATION_POOL;
  metadata: NormalYieldPoolMetadata;
  statistic?: NormalYieldPoolStatistic;
  maxPoolMembers?: number;
}

/**
 * @interface NativeYieldPoolInfo
 * @extends AbstractYieldPoolInfo
 * @prop {YieldPoolType.NATIVE_STAKING} type - Pool's type
 * @prop {NormalYieldPoolStatistic} [statistic] - Pool's metadata
 * */
export interface NativeYieldPoolInfo extends AbstractYieldPoolInfo {
  type: YieldPoolType.NATIVE_STAKING;
  metadata: NormalYieldPoolMetadata;
  statistic?: NormalYieldPoolStatistic;
  maxPoolMembers?: number;
}

/**
 * Info of yield pool
 * */
export type YieldPoolInfo = NativeYieldPoolInfo | NominationYieldPoolInfo | LiquidYieldPoolInfo | LendingYieldPoolInfo;

/**
 * @interface YieldAssetExpectedEarning
 * Pool expected return
 * */
export interface YieldAssetExpectedEarning {
  apy?: number,
  rewardInToken?: number
}
