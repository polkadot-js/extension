// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { APIItemState } from '@subwallet/extension-base/background/KoniTypes';

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
 * @interface LiquidYieldPoolInfo
 * @extends AbstractYieldPoolInfo
 * @prop {YieldPoolType.LIQUID_STAKING} type - Pool's type
 * @prop {string[]} derivativeAssets - Array of derivative tokens (slug)
 * @prop {string[]} inputAssets - Array of input tokens (slug)
 * @prop {string[]} rewardAssets - Array of reward tokens (slug)
 * @prop {string[]} feeAssets - Array of fee tokens (slug)
 * @prop {string[]} [altInputAssets] - Array of alt input tokens (slug)
 * */
export interface LiquidYieldPoolInfo extends AbstractYieldPoolInfo {
  type: YieldPoolType.LIQUID_STAKING

  /* Special info */

  /** Array of derivative tokens (slug) */
  derivativeAssets?: string[];

  /** Array of input tokens (slug) */
  inputAssets: string[]; // slug

  /** Array of reward tokens (slug) */
  rewardAssets: string[]; // slug

  /** Array of alt input tokens (slug) - optional */
  altInputAssets?: string[]; // TODO

  /** Array of fee tokens (slug) */
  feeAssets: string[],

  /* Special info */
}

/**
 * @interface NormalYieldPoolInfo
 * @extends AbstractYieldPoolInfo
 * @prop {Exclude<YieldPoolType,YieldPoolType.LIQUID_STAKING>} type - Pool's type
 * */
export interface NormalYieldPoolInfo extends AbstractYieldPoolInfo {
  type: Exclude<YieldPoolType, YieldPoolType.LIQUID_STAKING>;
}

/**
 * Info of yield pool
 * */
export type YieldPoolInfo = LiquidYieldPoolInfo | NormalYieldPoolInfo;

/* --------------- */

/**
 * @enum {string}
 * @description The earning status of an account in a pool.
 * */
export enum EarningStatus {
  /** Earning reward */
  EARNING_REWARD = 'EARNING_REWARD',
  /** Partially earning */
  PARTIALLY_EARNING = 'PARTIALLY_EARNING',
  /** Not earning */
  NOT_EARNING = 'NOT_EARNING',
  /** Waiting (Pool selected not in the reward list) */
  WAITING = 'WAITING',
  /** Account not staking */
  NOT_STAKING = 'NOT_STAKING'
}

/**
 * @enum {string}
 * @description The status of un-staked request.
 * */
export enum UnstakingStatus {
  /** Can withdraw unstaked value */
  CLAIMABLE = 'CLAIMABLE',
  /** Waiting to unlock unstake value */
  UNLOCKING = 'UNLOCKING'
}

/**
 * @interface NominationInfo
 * @description Info of the validator account joined
 * @prop {string} chain - Slug of chain
 * @prop {string} validatorAddress - Validator's address or nomination pool's id
 * @prop {string} [validatorIdentity] - Validator's identity
 * @prop {string} activeStake - Active staked value
 * @prop {boolean} [hasUnstaking] - Does the account have unstake request with validator?
 * @prop {string} [validatorMinStake] - Min amount to join with validator
 * @prop {EarningStatus} status - The staking status of the account
 * */
export interface NominationInfo {
  /** Slug of chain */
  chain: string;
  /** Validator's address or nomination pool's id */
  validatorAddress: string;
  /** Validator's identity */
  validatorIdentity?: string;
  /** Active staked value */
  activeStake: string;

  /** Does the account have unstake request with validator? */
  hasUnstaking?: boolean;
  /** Min amount to join with validator */
  validatorMinStake?: string;
  /** The staking status of the account */
  status: EarningStatus;
}

/**
 * @interface UnstakingInfo
 * @description Info of un-stake request
 * @prop {string} chain - Slug of chain
 * @prop {UnstakingStatus} status - Status of request
 * @prop {string} claimable - Amount to be withdrawn
 * @prop {number} [waitingTime] - Time remains to wait (in hours)
 * @prop {string} [validatorAddress] - Address of validator
 * */
export interface UnstakingInfo {
  /** Slug of chain */
  chain: string;
  /** Status of request */
  status: UnstakingStatus;
  /** Amount to be withdrawn */
  claimable: string;
  /** Time remains to wait (in hours) */
  waitingTime?: number;
  /** Address of validator */
  validatorAddress?: string;
}

export interface YieldAssetBalance {
  slug: string, // token slug
  activeBalance: string,
  exchangeRate?: number
}

/**
 * @interface EarningRewardItem
 * @prop {string} address - Account address
 * @prop {string} chain - Chain's slug
 * @prop {YieldPoolGroup} group - Pool's group
 * @prop {string} slug - Pool's slug
 * @prop {YieldPoolType} type - Pool's type
 * @prop {string} activeStake - Active stake of the account
 * @prop {YieldAssetBalance[]} balance - List balance related with stake
 * @prop {boolean} [isBondedBefore] - Is the account bonded in pool before?
 * @prop {NominationInfo[]} nominations - List nominations account joined - use for nomination pool and native staking
 * @prop {EarningStatus} status - Earning status of the account
 * @prop {UnstakingInfo[]} unstakings - List unstake request of the account - use for nomination pool and native staking
 * */
export interface YieldPositionInfo {
  /* Base info */

  /** Account address */
  address: string;
  /** Chain's slug */
  chain: string;
  /** Pool's group */
  group: YieldPoolGroup;
  /** Pool's slug */
  slug: string;
  /** Pool's type */
  type: YieldPoolType;

  /* Base info */

  /* Special info */

  /** Active stake of the account */
  activeStake: string;
  /** List balance related with stake */
  balance: YieldAssetBalance[]; // TODO: Must change
  /** Is the account bonded in pool before? */
  isBondedBefore?: boolean;
  /** List nominations account joined - use for nomination pool and native staking */
  nominations: NominationInfo[];
  /** Earning status of the account */
  status: EarningStatus;
  /** List unstake request of the account - use for nomination pool and native staking */
  unstakings: UnstakingInfo[];

  /* Special info */
}

/* --------------- */

/**
 * @interface EarningRewardItem
 * @prop {string} address - Account address
 * @prop {string} chain - Chain's slug
 * @prop {YieldPoolGroup} group - Pool's group
 * @prop {string} slug - Pool's slug
 * @prop {YieldPoolType} type - Pool's type
 * @prop {APIItemState} state - State of item
 * @prop {string} [latestReward] - Latest rewarded claimed
 * @prop {string} [totalReward] - Total rewarded claimed
 * @prop {string} [totalSlash] - Total token slashed
 * @prop {string} [unclaimedReward] - Un-claim reward
 * */
export interface EarningRewardItem {
  /* Base info */

  /** Account address */
  address: string;
  /** Chain's slug */
  chain: string;
  /** Pool's group */
  group: YieldPoolGroup;
  /** Pool's slug */
  slug: string;
  /** Pool's type */
  type: YieldPoolType;

  /* Base info */

  /* Special info */

  /** State of item */
  state: APIItemState;
  /** Latest rewarded claimed */
  latestReward?: string;
  /** Total rewarded claimed */
  totalReward?: string;
  /** Total token slashed */
  totalSlash?: string;
  /** Un-claim reward */
  unclaimedReward?: string;

  /* Special info */
}
