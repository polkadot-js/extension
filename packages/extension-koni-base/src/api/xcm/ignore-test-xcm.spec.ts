// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { DOTSAMA_AUTO_CONNECT_MS } from '@subwallet/extension-koni-base/constants';
import { getCurrentProvider } from '@subwallet/extension-koni-base/utils/utils';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { BN } from '@polkadot/util';

jest.setTimeout(50000);

describe('test DotSama APIs', () => {
  test('test get xcm extrinsic', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.acala_testnet), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;
    const weight = 4000000000;
    const fromAddress = '5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc';
    const toAddress = '0x40a207109cf531024B55010A1e760199Df0d3a13';

    const tx = apiPromise.tx.xTokens.transfer(
      {
        Token: 'AUSD'
      },
      new BN(1),
      {
        V1: {
          parents: 1,
          interior: {
            X2: [
              {
                Parachain: 1000
              },
              {
                AccountKey20: {
                  network: 'Any',
                  key: toAddress
                }
              }
            ]
          }
        }
      },
      weight
    );

    const fee = await tx.paymentInfo(fromAddress);

    console.log(fee.partialFee.toHuman());

    console.log((10 ** 12));
  });
});
