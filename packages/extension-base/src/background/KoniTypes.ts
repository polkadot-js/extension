// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { u128 } from '@polkadot/types';

export interface PriceJson {
  ready?: boolean;
  currency: string;
  priceMap: Record<string, number>;
}

export interface NftItem {
  id: string;
  name: string;
  image: string;
  external_url: string;
  rarity: string;
  collectionId: string;
  properties: Record<any, any>;
}

export interface NftCollection {
  collectionId: string;
  collectionName: string;
  image: string;
  nftItems: Array<NftItem>;
}

export interface NftJson {
  ready?: boolean;
  total: number;
  nftList: Array<NftCollection>;
}

export interface BalanceItem {
  total: u128;
  free: u128;
  reserved: u128;
  miscFrozen: u128;
  feeFrozen: u128;
}

export interface BalanceJson {
  ready?: boolean;
  total: BalanceItem;
  details: Record<string, BalanceItem>;
}

export interface RandomTestRequest {
  start: number;
  end: number;
}

export type RequestPrice = null
export type RequestSubscribePrice = null

export interface KoniRequestSignatures {
  'pri(nft.getNft)': [string, NftJson]
  'pri(price.getPrice)': [RequestPrice, PriceJson]
  'pri(price.getSubscription)': [RequestSubscribePrice, boolean, PriceJson]
  'pub(utils.getRandom)': [RandomTestRequest, number]
}
