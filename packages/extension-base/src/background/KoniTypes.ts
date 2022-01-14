// Copyright 2019-2021 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { u128 } from '@polkadot/types';

export interface PriceJson {
  ready?: boolean;
  currency: string;
  priceMap: Record<string, number>;
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
  'pri(price.getPrice)': [RequestPrice, PriceJson]
  'pri(price.getSubscription)': [RequestSubscribePrice, boolean, PriceJson]
  'pub(utils.getRandom)': [RandomTestRequest, number]
}
