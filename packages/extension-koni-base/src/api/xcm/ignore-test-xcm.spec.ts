// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { DOTSAMA_AUTO_CONNECT_MS } from '@subwallet/extension-koni-base/constants';
import { getCurrentProvider } from '@subwallet/extension-koni-base/utils';

import { ApiPromise, WsProvider } from '@polkadot/api';

jest.setTimeout(50000);

describe('test DotSama APIs', () => {
  test('test get xcm tx', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.acala), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;
    const paraId = PREDEFINED_NETWORKS.acala.paraId as number;

    const dest = {
      V1: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: paraId
            },
            {
              AccountKey20: {
                network: 'Any',
                key: '5GRfHt5wKwb3xGvJWkGgGMbbrTPctVs6PtNGg8eJbdMt51Vj'
              }
            }
          ]
        }
      }
    };

    // Case ParaChain vs ParaChain
    const paymentInfo = await apiPromise.tx.xTokens.transfer(
      {
        Token: 'AUSD'
      },
      '1',
      dest,
      4000000000
    ).paymentInfo('5GRfHt5wKwb3xGvJWkGgGMbbrTPctVs6PtNGg8eJbdMt51Vj');

    const fee = paymentInfo.partialFee.toString();

    console.log(fee);
  });
});
