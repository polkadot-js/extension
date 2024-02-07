// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BANXA_URL } from '@subwallet/extension-web-ui/constants';
import { CreateBuyOrderFunction } from '@subwallet/extension-web-ui/types';
import qs from 'querystring';

export const createBanxaOrder: CreateBuyOrderFunction = (token, address, network) => {
  return new Promise((resolve) => {
    const params = {
      coinType: token,
      blockchain: network,
      walletAddress: address,
      orderType: 'BUY'
    };

    const query = qs.stringify(params);

    resolve(`${BANXA_URL}?${query}`);
  });
};
