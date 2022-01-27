// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsicFunction } from '@polkadot/api/promise/types';
import { AccountJson, RequestAccountSubscribe } from '@polkadot/extension-base/background/types';
import { MetadataDefBase } from '@polkadot/extension-inject/types';
import { u128 } from '@polkadot/types';
import { Registry } from '@polkadot/types/types';

export interface PriceJson {
  ready?: boolean,
  currency: string,
  priceMap: Record<string, number>
}

export interface BalanceItem {
  ready?: boolean,
  free: string,
  reserved: string,
  miscFrozen: string,
  feeFrozen: string
}

export interface BalanceJson {
  details: Record<string, BalanceItem>
}

export interface ChainRegistry {
  chainDecimals: number[];
  chainTokens: string[];
}

export interface BalanceRPCItem {
  free: u128,
  reserved: u128,
  miscFrozen: u128,
  feeFrozen: u128
}

export interface BalanceRPCResponse {
  data: BalanceRPCItem
}

export interface DefaultFormatBalance {
  decimals?: number[] | number;
  unit?: string[] | string;
}

export interface ApiState {
  apiDefaultTx: SubmittableExtrinsicFunction;
  apiDefaultTxSudo: SubmittableExtrinsicFunction;
  isApiReady: boolean;
  isApiReadyOnce: boolean;
  isDevelopment?: boolean;
  isEthereum?: boolean;
  specName: string;
  specVersion: string;
  systemChain: string;
  systemName: string;
  systemVersion: string;
  registry: Registry;
  defaultFormatBalance: DefaultFormatBalance;
}

export interface ApiProps extends ApiState {
  api: ApiPromise;
  apiError?: string;
  apiUrl: string;
  isNotSupport?: boolean;
  isApiReadyOnce: boolean;
  isApiConnected: boolean;
  isEthereum: boolean;
  isApiInitialized: boolean;
  isReady: Promise<ApiProps>;
}

export type NetWorkGroup = 'RELAY_CHAIN' | 'POLKADOT_PARACHAIN'| 'KUSAMA_PARACHAIN' | 'NOT_SURE';

export interface NetWorkInfo {
  chain: string;
  genesisHash: string;
  icon?: string;
  ss58Format: number;
  chainType?: 'substrate' | 'ethereum';
  provider: string;
  group: NetWorkGroup;
  paraId?: number;
  isEthereum?: boolean;
}

export interface NetWorkMetadataDef extends MetadataDefBase {
  networkName: string;
  group: string
  isEthereum: boolean;
}

// all Accounts and the address of the current Account
export interface AccountsWithCurrentAddress {
  accounts: AccountJson[];
  currentAddress?: string;
}

export interface CurrentAccountInfo {
  address: string;
}

export interface RandomTestRequest {
  start: number;
  end: number;
}

export type RequestPrice = null
export type RequestSubscribePrice = null

export interface KoniRequestSignatures {
  'pri(price.getPrice)': [RequestPrice, PriceJson]
  'pri(price.getSubscription)': [RequestSubscribePrice, PriceJson, PriceJson],
  'pri(accounts.getAllWithCurrentAddress)': [RequestAccountSubscribe, boolean, AccountsWithCurrentAddress];
  'pub(utils.getRandom)': [RandomTestRequest, number]
}
