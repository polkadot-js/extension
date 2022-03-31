// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';

import { PriceJson } from '@polkadot/extension-base/background/KoniTypes';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';

const alternativeNameMap: Record<string, string> = {
  bifrost: 'bifrost-native-coin',
  calamari: 'calamari-network',
  crab: 'darwinia-crab-network',
  crust: 'crust-network',
  aleph: 'aleph-zero',
  darwinia: 'darwinia-network-native-token',
  kilt: 'kilt-protocol',
  kintsugi: 'kintsugi',
  parallel: 'paralink-network',
  phala: 'pha',
  picasso: 'pica',
  robonomics: 'robonomics-network',
  shadow: 'crust-storage-market',
  'sora-substrate': 'sora'
};

interface GeckoItem {
  id: string,
  name: string,
  current_price: number,
  symbol: string
}

export const getTokenPrice = async (chains: Array<string> = Object.keys(NETWORKS), currency = 'usd'): Promise<PriceJson> => {
  try {
    const inverseMap: Record<string, string> = {};
    const finalChains = chains.map((chain) => {
      const alterKey = alternativeNameMap[chain];

      if (alterKey) {
        inverseMap[alterKey] = chain;

        return alterKey;
      } else {
        return chain;
      }
    });

    finalChains.push(...['ausd', 'tai', 'kolibri-usd', 'zenlink-network-token']);

    const chainsStr = finalChains.join(',');
    const res = await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=${chainsStr}`);

    if (res.status !== 200) {
      console.warn('Failed to get token price');
    }

    const responseData = res.data as Array<GeckoItem>;
    const priceMap: Record<string, number> = {};
    const tokenPriceMap: Record<string, number> = {};

    responseData.forEach((val) => {
      if (inverseMap[val.id]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        priceMap[inverseMap[val.id]] = val.current_price;
      } else {
        priceMap[val.id] = val.current_price;
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
