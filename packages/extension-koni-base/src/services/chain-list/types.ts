// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export enum _ChainStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  STOPPED = 'STOPPED'
}

export enum _AssetType {
  NATIVE = 'NATIVE',
  LOCAL = 'LOCAL',
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  PSP22 = 'PSP22',
  PSP34 = 'PSP34'
}

export enum _ChainProviderStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  UNSTABLE = 'UNSTABLE'
}

export enum SubstrateChainCategory {
  RELAY_CHAIN = 'RELAY_CHAIN',
  PARACHAIN = 'PARACHAIN',
  TEST_NET = 'TEST_NET'
}

export interface _ChainInfo {
  slug: string,
  name: string,
  logo: string,
  providers: Record<string, string>,
  substrateInfo: _SubstrateInfo | null,
  evmInfo: _EvmInfo | null
}

export interface _ChainAsset {
  originChain: string,
  slug: string,
  name: string,
  symbol: string,
  decimals: number | null,
  priceId: string | null,
  minAmount: string | null,
  assetType: _AssetType,
  metadata: Record<any, any>,
  multiChainAsset: string | null
}

export interface _ChainProvider {
  id_: number,
  chainId_: number,
  providerName: string,
  endpoint: string,
  providerMode: string,
  status: _ChainProviderStatus
}

export interface _EvmInfo {
  evmChainId: number,
  blockExplorer: string | null,

  // some info about native tokens (for convenience)
  existentialDeposit: string,
  decimals: number,
  symbol: string
}

export interface _SubstrateInfo {
  paraId: number | null,
  genesisHash: string,
  addressPrefix: number,
  crowdloanUrl: string | null,
  category: SubstrateChainCategory[],
  blockExplorer: string | null,

  // some info about native tokens (for convenience)
  existentialDeposit: string,
  decimals: number,
  symbol: string
}

export interface _MultiChainAsset {
  id_: number,
  originChainAssetId_: number,
  name: string,
  symbol: string,
  priceId: string
}

export interface _AssetRef {
  id_: number,
  srcAssetId_: number,
  destAssetId_: number
}

export const _DEFAULT_NETWORKS = [
  'polkadot',
  'kusama'
];
