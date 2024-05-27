// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

/* eslint @typescript-eslint/no-empty-interface: "off" */

import { _AssetRef, _AssetType, _ChainAsset, _ChainInfo, _CrowdloanFund } from '@subwallet/chain-list/types';
import { _CHAIN_VALIDATION_ERROR } from '@subwallet/extension-base/services/chain-service/handler/types';
import { BehaviorSubject } from 'rxjs';
import Web3 from 'web3';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsicFunction } from '@polkadot/api/promise/types';
import { ChainProperties, ChainType } from '@polkadot/types/interfaces';
import { Registry } from '@polkadot/types/types';

export interface _DataMap {
  chainInfoMap: Record<string, _ChainInfo>,
  chainStateMap: Record<string, _ChainState>,
  assetRegistry: Record<string, _ChainAsset>,
  assetRefMap: Record<string, _AssetRef>
}

export enum _ChainConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  UNSTABLE = 'UNSTABLE',
  CONNECTING = 'CONNECTING',
}

export interface _ChainState {
  slug: string;
  active: boolean;
  currentProvider: string;
  manualTurnOff: boolean;
}

export interface _ChainApiStatus {
  slug: string,
  connectionStatus: _ChainConnectionStatus,
  lastUpdated: number,
}

export interface _SubstrateDefaultFormatBalance {
  decimals?: number[] | number;
  unit?: string[] | string;
}

export interface _ChainBaseApi {
  chainSlug: string;
  apiUrl: string;
  providerName?: string;

  apiError?: string;
  apiRetry?: number;
  isApiReady: boolean;
  isApiConnectedSubject: BehaviorSubject<boolean>;
  isApiReadyOnce: boolean;
  isApiConnected: boolean; // might be redundant
  connectionStatus: _ChainConnectionStatus; // might be redundant
  updateApiUrl: (apiUrl: string) => Promise<void>;
  connect: () => void;
  disconnect: () => Promise<void>;
  recoverConnect: () => Promise<void>;
  destroy: () => Promise<void>;

  isReady: Promise<_ChainBaseApi>; // to be overwritten by child interface
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
}

export type _NetworkUpsertParams = {
  mode: 'update' | 'insert',
  chainEditInfo: {
    chainType?: string,
    currentProvider: string,
    name?: string,
    providers: Record<string, string>,
    slug: string,
    symbol?: string,
    blockExplorer?: string,
    crowdloanUrl?: string,
    priceId?: string
  },
  chainSpec?: {
    // Substrate
    genesisHash: string,
    paraId: number | null,
    addressPrefix: number,
    crowdloanFunds?: _CrowdloanFund[] | null,
    crowdloanParaId?: number | null,

    // EVM
    evmChainId: number | null,

    // Common
    existentialDeposit: string,
    decimals: number
  },
  unconfirmed?: boolean;
  providerError?: _CHAIN_VALIDATION_ERROR;
}

export const _CUSTOM_PREFIX = 'custom-';

export interface EnableChainParams {
  chainSlug: string,
  enableTokens?: boolean
}
export interface EnableMultiChainParams {
  chainSlugs: string[],
  enableTokens?: boolean
}

export interface _ValidateCustomAssetRequest {
  contractAddress: string,
  originChain: string,
  type: _AssetType,
  contractCaller?: string
}

export interface _SmartContractTokenInfo {
  name: string,
  symbol: string,
  decimals: number,
  contractError: boolean
}

export interface _ValidateCustomAssetResponse extends _SmartContractTokenInfo {
  isExist: boolean,
  existedSlug?: string
}

export const _FUNGIBLE_CONTRACT_STANDARDS = [
  _AssetType.ERC20,
  _AssetType.PSP22,
  _AssetType.GRC20
];

export const _NFT_CONTRACT_STANDARDS = [
  _AssetType.PSP34,
  _AssetType.ERC721
];

export const _SMART_CONTRACT_STANDARDS = [..._FUNGIBLE_CONTRACT_STANDARDS, ..._NFT_CONTRACT_STANDARDS];
