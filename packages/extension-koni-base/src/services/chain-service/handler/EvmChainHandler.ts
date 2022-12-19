// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {_EvmApi} from '@subwallet/extension-koni-base/services/chain-service/types';
import Web3 from 'web3';

export class EvmChainHandler {
  private evmApiMap: Record<string, _EvmApi> = {};

  constructor () {
    console.log(this.evmApiMap);
  }

  public initApi (chainSlug: string, apiUrl: string): _EvmApi {
    let api: Web3;

    if (apiUrl.startsWith('http')) {
      api = new Web3(new Web3.providers.HttpProvider(apiUrl));
    } else {
      api = new Web3(new Web3.providers.WebsocketProvider(apiUrl));
    }

    let chainId = -1;

    api.eth.net.getId().then((_chainId) => {
      chainId = _chainId;
    }).catch(console.error);

    return ({
      api,
      chainId,

      chainSlug,
      apiUrl,

      isApiReady: true,
      isApiReadyOnce: true,
      isApiConnected: true,
      isApiInitialized: true,

      get isReady () {
        const self = this as _EvmApi;

        async function f(): Promise<_EvmApi> {
          return new Promise<_EvmApi>((resolve, reject) => {
            (function wait() {
              if (self.isApiReady) {
                return resolve(self);
              }

              setTimeout(wait, 10);
            })();
          });
        }

        return f();
      }
    }) as unknown as _EvmApi;
  }
}
