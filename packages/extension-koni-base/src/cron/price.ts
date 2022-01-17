// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getTokenPrice } from '@polkadot/extension-koni-base/api/coingecko';
import { state } from '@polkadot/extension-koni-base/background/handlers';

export function refreshPrice () {
  getTokenPrice()
    .then((rs) => {
      state.setPrice(rs, () => {
        console.log('Get Token Price From CoinGecko');
      });
    })
    .catch((err) => console.log(err));
}
