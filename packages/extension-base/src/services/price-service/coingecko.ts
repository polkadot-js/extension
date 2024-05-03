// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CurrencyJson, CurrencyType, ExchangeRateJSON, PriceJson } from '@subwallet/extension-base/background/KoniTypes';
import { staticData, StaticKey } from '@subwallet/extension-base/utils/staticData';
import axios, { AxiosResponse } from 'axios';

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
  try {
    const responseDataExchangeRate = (await axios.get('https://api-cache.subwallet.app/exchange-rate')).data as ExchangeRateItem || {};

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
    console.warn('Failed to get exchange rate');

    return {} as Record<CurrencyType, ExchangeRateJSON>;
  }
};

export const getPriceMap = async (priceIds: Set<string>, currency: CurrencyType = 'USD'): Promise<Omit<PriceJson, 'exchangeRateMap'>> => {
  const idStr = Array.from(priceIds).join(',');
  let rs: AxiosResponse<any, any> | undefined;

  if (!useBackupApi) {
    try {
      rs = await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency.toLowerCase()}&per_page=250&ids=${idStr}`);
    } catch (err) {
      useBackupApi = true;
    }
  }

  if (useBackupApi || rs?.status !== 200) {
    useBackupApi = true;
    rs = await axios.get(`https://chain-data.subwallet.app/api/price/get?ids=${idStr}`);
  }

  if (rs?.status !== 200) {
    console.warn('Failed to get token price');
  }

  const responseDataPrice = rs?.data as Array<GeckoItem> || [];
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
};
