// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

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
