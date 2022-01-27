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
