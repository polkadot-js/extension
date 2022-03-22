// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';
import { ApiProps } from '@polkadot/extension-base/background/KoniTypes';
import { MoonbeamNftApi } from '@polkadot/extension-koni-base/api/nft/moonbeam_nft/index';
import { TypeRegistry } from '@polkadot/types/create';

jest.setTimeout(50000);

describe('test moonbeam nft', () => {
  test('test get nft', async () => {
    const provider = new WsProvider('wss://wss.api.moonbeam.network');
    const registry = new TypeRegistry();

    await provider.connect();
    const api = new ApiPromise({ provider });

    const result: ApiProps = ({
      api,
      apiDefaultTx: undefined,
      apiDefaultTxSudo: undefined,
      apiError: undefined,
      apiUrl: 'wss://wss.api.moonbeam.network',
      defaultFormatBalance: undefined,
      isApiConnected: false,
      isApiReadyOnce: false,
      isApiInitialized: true,
      isApiReady: false,
      isEthereum: false,
      registry,
      specName: '',
      specVersion: '',
      systemChain: '',
      systemName: '',
      systemVersion: '',
      apiRetry: 0,
      recoverConnect: () => {
        result.apiRetry = 0;
        provider.connect().then(console.log).catch(console.error);
      },
      get isReady () {
        const self = this as ApiProps;

        async function f (): Promise<ApiProps> {
          if (!result.isApiReadyOnce) {
            await self.api.isReady;
          }

          return new Promise<ApiProps>((resolve, reject) => {
            (function wait () {
              if (self.isApiReady) {
                return resolve(self);
              }

              setTimeout(wait, 10);
            })();
          });
        }

        return f();
      }
    }) as unknown as ApiProps;

    const nftApi = new MoonbeamNftApi(result, ['0x3d6481dfc8275026f5311bc8767e6c2e38eef4e6'], 'moonbeam');

    console.log(nftApi.getChain());
  });
});
