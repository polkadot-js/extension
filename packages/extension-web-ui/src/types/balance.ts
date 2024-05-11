// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CurrencyJson } from '@subwallet/extension-base/background/KoniTypes';
import BigN from 'bignumber.js';

export type BalanceValueInfo = {
  value: BigN,
  convertedValue: BigN,
  pastConvertedValue: BigN,
};

export type PriceChangeStatus = 'increase' | 'decrease';

export interface TokenBalanceItemType {
  slug: string;
  logoKey: string;
  currency?: CurrencyJson;
  symbol: string;
  chain?: string;
  chainDisplayName?: string;
  isTestnet: boolean;
  isNotSupport: boolean;
  priceValue: number;
  price24hValue: number;
  priceChangeStatus?: PriceChangeStatus;
  free: BalanceValueInfo;
  locked: BalanceValueInfo;
  total: BalanceValueInfo;
  isReady: boolean;
  relatedChains: string[];
}
