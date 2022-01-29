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

export enum APIItemState {
  PENDING = 'pending',
  READY = 'ready',
  CACHED = 'cached',
  ERROR = 'error',
  NOT_SUPPORT = 'not_support'
}

export enum CrowdloanParaSate {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface BalanceItem {
  state: APIItemState,
  free: string,
  reserved: string,
  miscFrozen: string,
  feeFrozen: string
}

export interface BalanceJson {
  details: Record<string, BalanceItem>
}

export interface CrowdloanItem {
  state: APIItemState,
  paraState?: CrowdloanParaSate,
  contribute: string
}

export interface CrowdloanJson {
  details: Record<string, CrowdloanItem>
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

export type NetWorkGroup = 'RELAY_CHAIN' | 'POLKADOT_PARACHAIN'| 'KUSAMA_PARACHAIN' | 'UNKNOWN';

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
  networkKey: string;
  group: NetWorkGroup
  isEthereum: boolean;
  paraId?: number;
  isAvailable: boolean;
}

export type CurrentNetworkInfo = {
  networkKey: string;
  networkPrefix: number;
  icon: string;
  genesisHash: string;
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
export type RequestBalance = null
export type RequestSubscribeBalance = null
export type RequestCrowdloan = null
export type RequestSubscribeCrowdloan = null

export interface KoniRequestSignatures {
  'pri(price.getPrice)': [RequestPrice, PriceJson]
  'pri(price.getSubscription)': [RequestSubscribePrice, PriceJson, PriceJson],
  'pri(balance.getBalance)': [RequestBalance, BalanceJson],
  'pri(balance.getSubscription)': [RequestSubscribeBalance, BalanceJson, BalanceJson],
  'pri(crowdloan.getCrowdloan)': [RequestCrowdloan, CrowdloanJson],
  'pri(crowdloan.getSubscription)': [RequestSubscribeCrowdloan, CrowdloanJson, CrowdloanJson],
  'pri(accounts.getAllWithCurrentAddress)': [RequestAccountSubscribe, boolean, AccountsWithCurrentAddress];
  'pri(networkMetadata.list)': [null, NetWorkMetadataDef[]],
  'pri(chainRegistry.getSubscription)': [null, Record<string, ChainRegistry>, Record<string, ChainRegistry>],
  'pub(utils.getRandom)': [RandomTestRequest, number]
}
