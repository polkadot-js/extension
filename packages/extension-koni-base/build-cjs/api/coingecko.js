"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTokenPrice = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _endpoints = _interopRequireDefault(require("@polkadot/extension-koni-base/api/endpoints"));

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
const alternativeNameMap = {
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
  'sora-substrate': 'sora',
  astarEvm: 'astar'
};

const getTokenPrice = async function () {
  let chains = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Object.keys(_endpoints.default);
  let currency = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'usd';

  try {
    const inverseMap = {};
    const finalChains = chains.map(chain => {
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
    const res = await _axios.default.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=${chainsStr}`);

    if (res.status !== 200) {
      console.warn('Failed to get token price');
    }

    const responseData = res.data;
    const priceMap = {};
    const tokenPriceMap = {};
    responseData.forEach(val => {
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
    };
  } catch (err) {
    console.error('Failed to get token price', err);
    throw err;
  }
};

exports.getTokenPrice = getTokenPrice;