// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState } from '@subwallet/extension-base/background/KoniTypes';

import { BN } from '@polkadot/util';

export interface TokenBalanceRaw {
  reserved: BN,
  frozen: BN,
  free: BN
}

export interface SubstrateBalance {
  reserved?: string,
  miscFrozen?: string,
  feeFrozen?: string
}

/**
 * Balance info of a token on an address
 * @property {string} address - Address
 * @property {string} tokenSlug - Slug of token
 * @property {APIItemState} state - State of information
 * @property {number} [timestamp] - Time to get information
 * @property {string} free - Free balance
 * @property {string} locked - Locked balance
 * @property {SubstrateBalance} [substrateInfo] - Substrate info of balance
 */
export interface BalanceItem {
  // metadata
  address: string;
  tokenSlug: string;
  state: APIItemState;
  timestamp?: number;

  // must-have, total = free + locked
  free: string;
  locked: string;

  // substrate fields
  substrateInfo?: SubstrateBalance;
}

/** Balance info of all tokens on an address */
export type BalanceInfo = Record<string, BalanceItem>;
/** Balance info of all addresses */
export type BalanceMap = Record<string, BalanceInfo>;

export interface BalanceJson {
  reset?: boolean,
  details: BalanceMap;
}
