// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CurrencyJson, CurrencyType, ExchangeRateJSON, PriceJson } from '@subwallet/extension-base/background/KoniTypes';
import { staticData, StaticKey } from '@subwallet/extension-base/utils/staticData';

import { isArray } from '@polkadot/util';

interface GeckoItem {
  id: string,
  name: string,
  current_price: number,
  price_change_24h: number,
  symbol: string
}

interface ExchangeRateItem {
  result: string,
  time_last_update_unix: number,
  time_last_update_utc: string,
  time_next_update_unix: number,
  time_next_update_utc: number,
  base_code: string,
  conversion_rates: Record<string, number>
}
const DEFAULT_CURRENCY = 'USD';

let useBackupApi = false;

export const getExchangeRateMap = async (): Promise<Record<CurrencyType, ExchangeRateJSON>> => {
  let response: Response | undefined;

  try {
    try {
      response = await fetch('https://api-cache.subwallet.app/exchange-rate');
    } catch (e) {}

    if (response?.status !== 200) {
      try {
        response = await fetch('https://static-cache.subwallet.app/exchange-rate/data.json');
      } catch (e) {}
    }

    const responseDataExchangeRate = (await response?.json()) as ExchangeRateItem || {};

    const exchangeRateMap: Record<CurrencyType, ExchangeRateJSON> = Object.keys(responseDataExchangeRate.conversion_rates)
      .reduce((map, exchangeKey) => {
        if (!staticData[StaticKey.CURRENCY_SYMBOL][exchangeKey]) {
          return map;
        }

        map[exchangeKey as CurrencyType] = {
          exchange: responseDataExchangeRate.conversion_rates[exchangeKey],
          label: (staticData[StaticKey.CURRENCY_SYMBOL][exchangeKey] as CurrencyJson).label
        };

        return map;
      }, {} as Record<CurrencyType, ExchangeRateJSON>);

    return exchangeRateMap;
  } catch (e) {
    return {} as Record<CurrencyType, ExchangeRateJSON>;
  }
};

export const getPriceMap = async (priceIds: Set<string>, currency: CurrencyType = 'USD'): Promise<Omit<PriceJson, 'exchangeRateMap'>> => {
  const idStr = Array.from(priceIds).join(',');
  let response: Response | undefined;

  try {
    if (!useBackupApi) {
      try {
        response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency.toLowerCase()}&per_page=250&ids=${idStr}`);
      } catch (err) {
        useBackupApi = true;
      }
    }

    if (useBackupApi || response?.status !== 200) {
      useBackupApi = true;

      try {
        response = await fetch(`https://api-cache.subwallet.app/api/price/get?ids=${idStr}`);
      } catch (e) {}

      if (response?.status !== 200) {
        try {
          response = await fetch('https://static-cache.subwallet.app/price/data.json');
        } catch (e) {}
      }
    }

    const generateDataPriceRaw = await response?.json() as unknown || [];
    const responseDataPrice = isArray(generateDataPriceRaw)
      ? generateDataPriceRaw as Array<GeckoItem>
      : Object.entries(generateDataPriceRaw).map(([id, value]) => ({ ...value, id }) as GeckoItem);
    const currencyData = staticData[StaticKey.CURRENCY_SYMBOL][currency || DEFAULT_CURRENCY] as CurrencyJson;
    const priceMap: Record<string, number> = {};
    const price24hMap: Record<string, number> = {};

    responseDataPrice.forEach((val) => {
      const currentPrice = val.current_price || 0;
      const price24h = currentPrice - (val.price_change_24h || 0);

      priceMap[val.id] = currentPrice;
      price24hMap[val.id] = price24h;
    });

    return {
      currency,
      currencyData,
      priceMap,
      price24hMap
    };
  } catch (e) {
    return {} as Omit<PriceJson, 'exchangeRateMap'>;
  }
};
