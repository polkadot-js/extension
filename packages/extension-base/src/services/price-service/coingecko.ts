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

let useBackupApi = false;

export const getTokenPrice = async (priceIds: Set<string>, currencyCode: CurrencyType = 'USD'): Promise<PriceJson> => {
  try {
    const idStr = Array.from(priceIds).join(',');
    const res: AxiosResponse<any, any>[] = [];

    const getPriceMap = async () => {
      if (!useBackupApi) {
        try {
          res[0] = await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currencyCode.toLowerCase()}&per_page=250&ids=${idStr}`);
        } catch (err) {
          useBackupApi = true;
        }
      }

      if (useBackupApi || res[0]?.status !== 200) {
        useBackupApi = true;
        res[0] = await axios.get(`https://chain-data.subwallet.app/api/price/get?ids=${idStr}`);
      }

      if (res[0].status !== 200) {
        console.warn('Failed to get token price');
      }
    };

    const getExchangeRate = async () => {
      try {
        res[1] = await axios.get('https://api-cache.subwallet.app/exchange-rate');
      } catch (e) {
        console.warn('Failed to get exchange rate');
      }

      if (res[1].status !== 200) {
        console.warn('Failed to get exchange rate');
      }
    };

    await Promise.all([
      getPriceMap(),
      getExchangeRate()
    ]);

    const responseDataPrice = res[0].data as Array<GeckoItem> || [];
    const responseDataExchangeRate = res[1].data as ExchangeRateItem || {};
    const priceMap: Record<string, number> = {};
    const price24hMap: Record<string, number> = {};
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
    const currency = staticData[StaticKey.CURRENCY_SYMBOL][currencyCode];

    responseDataPrice.forEach((val) => {
      const currentPrice = val.current_price || 0;
      const price24h = currentPrice - (val.price_change_24h || 0);
      const exchangeRate = exchangeRateMap[currencyCode] || 1;

      priceMap[val.id] = currentPrice * exchangeRate.exchange;
      price24hMap[val.id] = price24h * exchangeRate.exchange;
    });

    return {
      currencyCode,
      currency,
      exchangeRateMap,
      priceMap,
      price24hMap
    } as PriceJson;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
