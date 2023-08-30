// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { generateOnRampURL } from '@coinbase/cbpay-js';
import { CreateBuyOrderFunction } from '@subwallet/extension-koni-ui/types';

export const createCoinbaseOrder: CreateBuyOrderFunction = (symbol, address, network) => {
  return new Promise((resolve) => {
    const onRampURL = generateOnRampURL({
      appId: '1dbd2a0b94',
      destinationWallets: [
        { address: address, blockchains: [network], assets: [symbol] }
      ]
    });

    resolve(onRampURL);
  });
};
