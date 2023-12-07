// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolGroup, YieldPoolType } from '../base';
import { EarningStatus, NominationInfo } from './target';
import { UnstakingInfo } from './unstake';

export interface YieldAssetBalance {
  slug: string, // token slug
  activeBalance: string,
  exchangeRate?: number
}

/**
 * @interface YieldPositionInfo
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
