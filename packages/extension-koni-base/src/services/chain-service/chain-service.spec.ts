// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DOTSAMA_AUTO_CONNECT_MS } from '@subwallet/extension-koni-base/constants';

import { ApiPromise, WsProvider } from '@polkadot/api';

describe('test ChainService', () => {
  test('test get chains', async () => {
    const provider = new WsProvider('wss://astar.api.onfinality.io/public-ws', DOTSAMA_AUTO_CONNECT_MS);
    const apiPromise = new ApiPromise({ provider });

    await apiPromise.isReady;
  });
});
