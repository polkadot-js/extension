// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PhosphorIcon } from '@subwallet/extension-koni-ui/types';
import { CurrencyDollar, CurrencyEur, CurrencyGbp, CurrencyJpy, CurrencyRub } from 'phosphor-react';

export interface CurrencySymbol {
  icon: PhosphorIcon | React.ReactNode;
}
export enum CurrencyType {
  USD = 'USD',
  BRL = 'BRL',
  CNY = 'CNY',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  HKD = 'HKD',
  VND = 'VND',
  RUB = 'RUB',
}

// todo: About label, will convert to key for i18n later
export const getCurrencySymbol = (key: string): CurrencySymbol => {
  switch (key) {
    case CurrencyType.USD:
      return { icon: CurrencyDollar };
    case CurrencyType.BRL:
      return { icon: CurrencyType.BRL };
    case CurrencyType.CNY:
      return { icon: CurrencyType.CNY };
    case CurrencyType.EUR:
      return { icon: CurrencyEur };
    case CurrencyType.GBP:
      return { icon: CurrencyGbp };
    case CurrencyType.JPY:
      return { icon: CurrencyJpy };
    case CurrencyType.HKD:
      return { icon: CurrencyType.HKD };
    case CurrencyType.VND:
      return { icon: CurrencyType.VND };
    case CurrencyType.RUB:
      return { icon: CurrencyRub };
    default:
      throw new Error(`Unknown currency type: ${key}`);
  }
};
