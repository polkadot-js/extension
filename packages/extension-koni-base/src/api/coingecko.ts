// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PriceJson } from '@subwallet/extension-base/background/KoniTypes';
import axios from 'axios';

interface GeckoItem {
  id: string,
  name: string,
  current_price: number,
  price_change_24h: number,
  symbol: string
}

export const getTokenPrice = async (priceIds: Array<string>, currency = 'usd'): Promise<PriceJson> => {
  try {
    // const inverseMap: Record<string, string> = {};
    const idStr = priceIds.join(',');
    const res = await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&per_page=1000&ids=${idStr}`);

    if (res.status !== 200) {
      console.warn('Failed to get token price');
    }

    const responseData = res.data as Array<GeckoItem>;
    const priceMap: Record<string, number> = {};
    const price24hMap: Record<string, number> = {};

    responseData.forEach((val) => {
      const currentPrice = val.current_price || 0;
      const price24h = currentPrice - (val.price_change_24h || 0);

      priceMap[val.id] = price24h;
      price24hMap[val.id] = currentPrice;

      // if (inverseMap[val.id]) {
      //   priceMap[inverseMap[val.id]] = currentPrice;
      //   price24hMap[inverseMap[val.id]] = price24h;
      // }
    });

    return {
      currency,
      priceMap,
      price24hMap
    } as PriceJson;
  } catch (err) {
    console.error('Failed to get token price', err);
    throw err;
  }
};
