// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { DOTSAMA_AUTO_CONNECT_MS } from '@subwallet/extension-koni-base/constants';
import { getCurrentProvider } from '@subwallet/extension-koni-base/utils';

import { ApiPromise, WsProvider } from '@polkadot/api';

jest.setTimeout(5000000);

describe('test DotSama APIs', () => {
  test('test get Validator', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.alephTest), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;

    apiPromise.
  });
});
