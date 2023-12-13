// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PriceJson } from '@subwallet/extension-base/background/KoniTypes';

interface GeckoItem {
  id: string,
  name: string,
  current_price: number,
  price_change_24h: number,
  symbol: string
}

let useBackupApi = false;

export const getTokenPrice = async (priceIds: Set<string>, currency = 'usd'): Promise<PriceJson> => {
  try {
    const idStr = Array.from(priceIds).join(',');
    let res;

    if (!useBackupApi) {
      try {
        res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&per_page=250&ids=${idStr}`);
      } catch (err) {
        useBackupApi = true;
      }
    }

    if (useBackupApi || res?.status !== 200) {
      useBackupApi = true;
      res = await fetch(`https://chain-data.subwallet.app/api/price/get?ids=${idStr}`);
    }

    if (res.status !== 200) {
      console.warn('Failed to get token price');
    }

    const responseData = await res.json() as Array<GeckoItem> || [];
    const priceMap: Record<string, number> = {};
    const price24hMap: Record<string, number> = {};

    responseData.forEach((val) => {
      const currentPrice = val.current_price || 0;
      const price24h = currentPrice - (val.price_change_24h || 0);

      priceMap[val.id] = currentPrice;
      price24hMap[val.id] = price24h;
    });

    return {
      currency,
      priceMap,
      price24hMap
    } as PriceJson;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
