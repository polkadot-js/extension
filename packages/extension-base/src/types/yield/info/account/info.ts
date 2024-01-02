// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { BasePoolInfo, YieldPoolType } from '../base';
import { EarningStatus, NominationInfo } from './target';
import { UnstakingInfo } from './unstake';

export interface YieldAssetBalance {
  slug: string, // token slug
  activeBalance: string,
  exchangeRate?: number
}

/**
 * @interface BaseYieldPositionInfo
 * @extends BasePoolInfo
 * @prop {string} address - Account address
 * */
export interface BaseYieldPositionInfo extends BasePoolInfo {
  /* Base info */

  /** Account address */
  address: string;

  /* Base info */
}

/**
 * @interface AbstractYieldPositionInfo
 * @prop {string} address - Account address
 * @prop {string} chain - Chain's slug
 * @prop {YieldPoolGroup} group - Pool's group
 * @prop {string} slug - Pool's slug
 * @prop {YieldPoolType} type - Pool's type
 * @prop {string} totalStake - Total stake of the account
 * @prop {string} activeStake - Active stake of the account
 * @prop {string} unstakeBalance - Unstaking balance of the account
 * @prop {YieldAssetBalance[]} balance - List balance related with stake
 * @prop {boolean} isBondedBefore - Is the account bonded in pool before?
 * @prop {NominationInfo[]} nominations - List nominations account joined - use for nomination pool and native staking
 * @prop {EarningStatus} status - Earning status of the account
 * @prop {UnstakingInfo[]} unstakings - List unstake request of the account - use for nomination pool and native staking
 * */
export interface AbstractYieldPositionInfo extends BaseYieldPositionInfo {
  /* Special info */

  /** Token to show */
  balanceToken: string;
  /** Total stake of the account */
  totalStake: string;
  /** Active stake of the account */
  activeStake: string;
  /** Unstaking balance of the account */
  unstakeBalance: string;
  /** Is the account bonded in pool before? */
  isBondedBefore: boolean;
  /** List nominations account joined - use for nomination pool and native staking */
  nominations: NominationInfo[];
  /** Earning status of the account */
  status: EarningStatus;
  /** List unstake request of the account - use for nomination pool and native staking */
  unstakings: UnstakingInfo[];

  /* Special info */
}

/**
 * @interface SpecialYieldPositionInfo
 * @extends AbstractYieldPositionInfo
 * @prop {string} rootAsset - Input token - Root token before stake and after unstake (slug)
 * */
export interface SpecialYieldPositionInfo extends AbstractYieldPositionInfo {
  type: YieldPoolType.LIQUID_STAKING | YieldPoolType.LENDING;
  /** @description
   * <p>Derivative token - Token got after stake (slug)</p>
   * <p>To detect exchange rate</p>
   * <p>Exchange rate = root token amount / balance token amount</p>
   * */
  derivativeToken: string;
}

/**
 * @interface LiquidYieldPositionInfo
 * @extends SpecialYieldPositionInfo
 * @prop {YieldPoolType.LIQUID_STAKING} type - Pool's type
 * */
export interface LiquidYieldPositionInfo extends SpecialYieldPositionInfo {
  type: YieldPoolType.LIQUID_STAKING;
}

/**
 * @interface LendingYieldPositionInfo
 * @extends SpecialYieldPositionInfo
 * @prop {YieldPoolType.LENDING} type - Pool's type
 * */
export interface LendingYieldPositionInfo extends SpecialYieldPositionInfo {
  type: YieldPoolType.LENDING;
}

/**
 * @interface NominationYieldPositionInfo
 * @extends AbstractYieldPositionInfo
 * @prop {YieldPoolType.NOMINATION_POOL} type - Pool's type
 * */
export interface NominationYieldPositionInfo extends AbstractYieldPositionInfo {
  type: YieldPoolType.NOMINATION_POOL;
}

/**
 * @interface NativeYieldPositionInfo
 * @extends AbstractYieldPositionInfo
 * @prop {YieldPoolType.NATIVE_STAKING} type - Pool's type
 * */
export interface NativeYieldPositionInfo extends AbstractYieldPositionInfo {
  type: YieldPoolType.NATIVE_STAKING;
}

/**
 * Info of yield pool
 * */
export type YieldPositionInfo = NativeYieldPositionInfo | NominationYieldPositionInfo | LiquidYieldPositionInfo | LendingYieldPositionInfo;
