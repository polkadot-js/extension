// Copyright 2019-2021 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { getTokenPrice } from '@polkadot/extension-koni-base/api/coingecko';
import { state } from '@polkadot/extension-koni-base/background/handlers';
import { PriceJson } from '@polkadot/extension-koni-base/stores/types';

export function refreshPrice () {
  getTokenPrice()
    .then((rs: PriceJson) => {
      state.setPrice(rs, (priceData) => {
        console.log('Get Token Price From CoinGecko');
      });
    })
    .catch((err) => {
      console.error(err);
    });
}
