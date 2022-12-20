// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _EvmChainSpec } from '@subwallet/extension-koni-base/services/chain-service/handler/types';
import { _EvmApi } from '@subwallet/extension-koni-base/services/chain-service/types';
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

    return ({
      api,

      chainSlug,
      apiUrl,

      isApiReady: true,
      isApiReadyOnce: true,
      isApiConnected: true,
      isApiInitialized: true,

      get isReady () {
        const self = this as _EvmApi;

        async function f (): Promise<_EvmApi> {
          return new Promise<_EvmApi>((resolve, reject) => {
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
    }) as unknown as _EvmApi;
  }

  public async getChainSpec (evmApi: _EvmApi) {
    const chainId = await evmApi.api.eth.getChainId();
    let chainInfoList: Record<string, any>[] | undefined;
    const result: _EvmChainSpec = {
      evmChainId: chainId,
      name: '',
      symbol: '',
      decimals: 18, // by default, might change
      existentialDeposit: '0'
    };

    await fetch('https://chainid.network/chains.json')
      .then((resp) => resp.json())
      .then((data: Record<string, any>[]) => {
        chainInfoList = data;
      });

    if (chainInfoList) {
      chainInfoList.forEach((_chainInfo) => {
        const _chainId = _chainInfo.chainId as number;

        if (chainId === _chainId) {
          result.name = _chainInfo.name as string;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          result.symbol = _chainInfo.nativeCurrency.symbol as string;
        }
      });
    }

    return result;
  }
}
