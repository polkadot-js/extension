// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { APIItemState } from '@subwallet/extension-base/background/KoniTypes';

import { YieldPoolType } from '../base';

/**
 * @interface EarningRewardItem
 * @prop {string} address - Account address
 * @prop {string} chain - Chain's slug
 * @prop {string} group - Pool's group
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
  group: string;
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

export interface EarningRewardJson {
  ready: boolean;
  data: Record<string, EarningRewardItem>;
}
