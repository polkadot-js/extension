// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PriceJson } from '@subwallet/extension-base/background/KoniTypes';
import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import axios from 'axios';

// This map used to get common token for xcToken or calculate assets price
interface GeckoItem {
  id: string,
  name: string,
  current_price: number,
  symbol: string
}

export const getTokenPrice = async (chains: Array<string> = Object.keys(PREDEFINED_NETWORKS), currency = 'usd'): Promise<PriceJson> => {
  try {
    const inverseMap: Record<string, string> = {};

    chains.push(...['ethereum', 'bitcoin', 'tether', 'usd-coin', 'binancecoin', 'binance-usd', 'xrp', 'solana', 'dai', 'acala-dollar', 'kolibri-usd', 'zenlink-network-token']);

    const chainsStr = chains.join(',');
    const res = await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&per_page=1000&ids=${chainsStr}`);

    if (res.status !== 200) {
      console.warn('Failed to get token price');
    }

    const responseData = res.data as Array<GeckoItem>;
    const priceMap: Record<string, number> = {};
    const tokenPriceMap: Record<string, number> = {};

    responseData.forEach((val) => {
      priceMap[val.id] = val.current_price;

      if (inverseMap[val.id]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        priceMap[inverseMap[val.id]] = val.current_price;
      }

      tokenPriceMap[val.symbol] = val.current_price;
    });

    return {
      currency,
      priceMap,
      tokenPriceMap
    } as PriceJson;
  } catch (err) {
    console.error('Failed to get token price', err);
    throw err;
  }
};
