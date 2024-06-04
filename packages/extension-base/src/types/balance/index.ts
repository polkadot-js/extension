// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { _BalanceMetadata, APIItemState, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';

import { ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';

export interface TokenBalanceRaw {
  reserved: BN,
  frozen: BN,
  free: BN
}

/**
 * Balance info of a token on an address
 * @property {string} address - Address
 * @property {string} tokenSlug - Slug of token
 * @property {APIItemState} state - State of information
 * @property {number} [timestamp] - Time to get information
 * @property {string} free - Transferable balance
 * @property {string} locked - Locked balance, cannot be transferred, locked here is only meaningful in the context of token transfer
 * @property {metadata} [metadata] - Could be anything, supposed to be generic to handle various contexts
 */
export interface BalanceItem {
  // metadata
  address: string;
  tokenSlug: string;
  state: APIItemState;
  timestamp?: number;

  // must-have, total = transferable + locked
  free: string;
  locked: string;

  // substrate fields
  metadata?: _BalanceMetadata;
}

/** Balance info of all tokens on an address */
export type BalanceInfo = Record<string, BalanceItem>; // Key is tokenSlug
/** Balance info of all addresses */
export type BalanceMap = Record<string, BalanceInfo>; // Key is address

export interface BalanceJson {
  reset?: boolean,
  details: BalanceMap;
}

export interface SubscribeBasePalletBalance {
  addresses: string[];
  assetMap: Record<string, _ChainAsset>;
  chainInfo: _ChainInfo;
  callback: (rs: BalanceItem[]) => void;
  extrinsicType?: ExtrinsicType;
}

export interface SubscribeSubstratePalletBalance extends SubscribeBasePalletBalance {
  substrateApi: ApiPromise;
  includeNativeToken?: boolean;
}

export interface SubscribeEvmPalletBalance extends SubscribeBasePalletBalance {
  evmApi: _EvmApi;
}
