// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint @typescript-eslint/no-empty-interface: "off" */

import { _ChainInfo } from '@subwallet/extension-koni-base/services/chain-list/types';
import Web3 from 'web3';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsicFunction } from '@polkadot/api/promise/types';
import { ChainProperties, ChainType } from '@polkadot/types/interfaces';
import { Registry } from '@polkadot/types/types';

export interface _DataMap {
  chainInfoMap: Record<string, _ChainInfo>,
  chainStateMap: Record<string, _ChainState>
}

export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  UNSTABLE = 'UNSTABLE'
}

export interface _ChainState {
  slug: string,
  active: boolean,
  currentProvider: string,
  connectionStatus: ConnectionStatus
}

export interface _SubstrateDefaultFormatBalance {
  decimals?: number[] | number;
  unit?: string[] | string;
}

export interface _ChainBaseApi {
  chainSlug: string;
  apiUrl: string;

  apiError?: string;
  apiRetry?: number;
  isApiReady: boolean;
  isApiReadyOnce: boolean;
  isApiConnected: boolean; // might be redundant
  isApiInitialized: boolean;
  isDevelopment?: boolean;
  recoverConnect?: () => void;

  isReady: Promise<any>; // to be overwritten by child interface
}

export interface _SubstrateChainMetadata {
  properties: ChainProperties;
  systemChain: string;
  systemChainType: ChainType;
  systemName: string;
  systemVersion: string;
}

export interface _SubstrateApiState {
  apiDefaultTx?: SubmittableExtrinsicFunction;
  apiDefaultTxSudo?: SubmittableExtrinsicFunction;
  defaultFormatBalance?: _SubstrateDefaultFormatBalance;
}

export interface _SubstrateApi extends _SubstrateApiState, _ChainBaseApi {
  api: ApiPromise;
  isNotSupport?: boolean;

  isReady: Promise<_SubstrateApi>;

  specName: string;
  specVersion: string;
  systemChain: string;
  systemName: string;
  systemVersion: string;
  registry: Registry;
}

export interface _EvmApi extends _ChainBaseApi {
  api: Web3;

  isReady: Promise<_EvmApi>;

  chainId: number;
}

export const CUSTOM_NETWORK_PREFIX = 'custom-';
