// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { BaseRequestSign, InternalRequestSign } from '@subwallet/extension-base/background/KoniTypes';

import { UnstakingInfo } from '../info';

/**
 * @interface RequestYieldLeave
 * @description Request params to leave pool
 * @prop {string} address - Request account
 * @prop {string} amount - Amount token want to leave
 * @prop {string} slug - Pool's slug
 * @prop {string} [selectedTarget] - Pool target want to leave (nomination pool and native staking need)
 * @prop {boolean} fastLeave - Fast leave pool (swap token)
 * */
export interface RequestYieldLeave extends BaseRequestSign {
  /** Request account */
  address: string;
  /** Amount token want to leave */
  amount: string;
  /** Pool's slug */
  slug: string;
  /** Pool target want to leave (nomination pool and native staking need) */
  selectedTarget?: string;
  /** Fast leave pool (swap token) */
  fastLeave: boolean;
}

/**
 * @interface RequestYieldWithdrawal
 * @description Request params to withdraw
 * @prop {string} address - Request account
 * @prop {string} slug - Pool's slug
 * @prop {UnstakingInfo} unstakingInfo - Info of unstaking request wants to withdraw
 * */
export interface RequestYieldWithdrawal extends BaseRequestSign {
  /** Request account */
  address: string;
  /** Pool's slug */
  slug: string;
  /**
   * <p>
   *  Info of unstaking request wants to withdraw
   * </p>
   * <p>
   *  Need to create amount on history
   * </p>
   * */
  unstakingInfo: UnstakingInfo;
}

export interface StakeCancelWithdrawalParams extends BaseRequestSign {
  address: string;
  slug: string;
  chain: string;
  selectedUnstaking: UnstakingInfo;
}

export type RequestStakeCancelWithdrawal = InternalRequestSign<StakeCancelWithdrawalParams>;

export interface StakeClaimRewardParams extends BaseRequestSign {
  address: string;
  slug: string;
  chain: string;
  unclaimedReward?: string;
  bondReward?: boolean;
}

export type RequestStakeClaimReward = InternalRequestSign<StakeClaimRewardParams>;
