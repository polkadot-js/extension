// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface PriceJson {
  ready?: boolean,
  currency: string,
  priceMap: Record<string, number>
}

export interface BalanceItem {
  free: string,
  reserved: string,
  miscFrozen: string,
  feeFrozen: string,
}

export interface BalanceJson {
  ready?: boolean,
  details: Record<string, BalanceItem>
}

export interface RandomTestRequest {
  start: number;
  end: number;
}

export type RequestPrice = null
export type RequestSubscribePrice = null

export interface KoniRequestSignatures {
  'pri(price.getPrice)': [RequestPrice, PriceJson]
  'pri(price.getSubscription)': [RequestSubscribePrice, PriceJson, PriceJson]
  'pub(utils.getRandom)': [RandomTestRequest, number]
}
