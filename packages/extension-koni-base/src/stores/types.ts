// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { u128 } from '@polkadot/types';

export interface PriceJson {
  ready?: boolean,
  currency: string,
  priceMap: Record<string, number>
}

export interface BalanceItem {
  total: u128,
  free: u128,
  reserved: u128,
  miscFrozen: u128,
  feeFrozen: u128,
}

export interface BalanceJson {
  ready?: boolean,
  total: BalanceItem,
  details: Record<string, BalanceItem>
}
