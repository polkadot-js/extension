// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RMRK_VER } from '@subwallet/extension-base/background/KoniTypes';

import { SubmittableExtrinsic } from '@polkadot/api/types';

// For rendering purposes only
export interface _NftItem {
  id?: string;
  name?: string;
  image?: string;
  external_url?: string;
  rarity?: string;
  collectionId?: string;
  description?: string;
  properties?: Record<any, any> | null;
  chain?: string;
  rmrk_ver?: RMRK_VER;
}

export interface _NftCollection {
  collectionId: string;
  collectionName?: string;
  image?: string;
  chain?: string;
  nftItems: _NftItem[];
}

export interface _NftJson {
  ready?: boolean;
  total: number;
  nftList: Array<_NftCollection>;
}

export interface Web3TransferParams {
  rawTx: Record<string, any>;
  estimatedGas: string;
}

export interface SubstrateTransferParams {
  extrinsic: SubmittableExtrinsic<'promise'>;
  estimatedFee?: string;
}

export interface TransferResponse {
  // substrate
  estimatedFee?: string;
  extrinsic?: SubmittableExtrinsic<'promise'>;
  // eth
  web3RawTx?: Record<string, any>;
  estimatedGas?: string
}

export enum SUPPORTED_TRANSFER_CHAIN_NAME {
  statemine = 'statemine',
  acala = 'acala',
  karura = 'karura',
  kusama = 'kusama',
  uniqueNft = 'uniqueNft',
  quartz = 'quartz',
  opal = 'opal',
  statemint = 'statemint',
  bitcountry = 'bitcountry',
  moonbeam = 'moonbeam',
  moonbase = 'moonbase',
  astarEvm = 'astarEvm',
  moonriver = 'moonriver',
  shiden = 'shiden',
  shibuya = 'shibuya'
}

export const SUPPORTED_TRANSFER_SUBSTRATE_CHAIN = [
  SUPPORTED_TRANSFER_CHAIN_NAME.statemine as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.acala as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.karura as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.kusama as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.uniqueNft as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.quartz as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.opal as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.statemint as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.bitcountry as string
];

export const SUPPORTED_TRANSFER_EVM_CHAIN = [
  SUPPORTED_TRANSFER_CHAIN_NAME.moonbase as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.moonbeam as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.moonriver as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.astarEvm as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.shiden as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.shibuya as string
];
