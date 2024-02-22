// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

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
  /** Timestamp to withdraw */
  targetTimestampMs: number;
  /** Address of validator */
  validatorAddress?: string;
}
