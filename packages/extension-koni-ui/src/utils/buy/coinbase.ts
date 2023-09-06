// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { generateOnRampURL } from '@coinbase/cbpay-js';
import { COINBASE_PAY_ID } from '@subwallet/extension-koni-ui/constants';
import { CreateBuyOrderFunction } from '@subwallet/extension-koni-ui/types';

export const createCoinbaseOrder: CreateBuyOrderFunction = (symbol, address, network) => {
  return new Promise((resolve) => {
    const onRampURL = generateOnRampURL({
      appId: COINBASE_PAY_ID,
      destinationWallets: [
        { address: address, supportedNetworks: [network], assets: [symbol] }
      ]
    });

    resolve(onRampURL);
  });
};
