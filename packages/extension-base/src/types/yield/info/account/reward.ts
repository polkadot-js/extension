// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { APIItemState } from '@subwallet/extension-base/background/KoniTypes';

import { BasePoolInfo } from '../base';

/**
 * @interface EarningRewardItem
 * @extends BasePoolInfo
 * @prop {string} address - Account address
 * @prop {APIItemState} state - State of item
 * @prop {string} [latestReward] - Latest rewarded claimed
 * @prop {string} [totalReward] - Total rewarded claimed
 * @prop {string} [totalSlash] - Total token slashed
 * @prop {string} [unclaimedReward] - Un-claim reward
 * */
export interface EarningRewardItem extends BasePoolInfo {
  /* Base info */

  /** Account address */
  address: string;

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

export interface EarningRewardJson {
  ready: boolean;
  data: Record<string, EarningRewardItem>;
}

/**
 * @interface EarningRewardHistoryItem
 * @extends BasePoolInfo
 * @prop {string} address - Account address
 * @prop {number} blockTimestamp - Reward history's block timestamp
 * @prop {string} amount - Reward history's amount
 * */
export interface EarningRewardHistoryItem extends BasePoolInfo {
  /** Account address */
  address: string;
  /** Reward history's block timestamp */
  blockTimestamp: number;
  /** Reward history's amount */
  amount: string;
}
