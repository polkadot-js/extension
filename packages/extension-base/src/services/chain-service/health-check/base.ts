// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmApi } from '@subwallet/extension-base/services/chain-service/handler/EvmApi';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';

import { ApiPromise, WsProvider } from '@polkadot/api';

export const failedMessage = 'Connect failed';
export const timeoutMessage = 'Connect timeout';

export const substrateHandleConnectChain = async (chain: string, key: string, provider: string, hash: string): Promise<[ApiPromise, string]> => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
  return new Promise<[ApiPromise, string]>(async (resolve) => {
    console.log('start', chain, key, provider);

    const _api = new ApiPromise({ provider: new WsProvider(provider) });

    let logFail = true;

    const handlerOnFail = (e: Error) => {
      if (logFail) {
        console.log('error', chain, key);
        resolve([_api, e?.message || failedMessage]);
      }

      logFail = false;
    };

    const timeout = setTimeout(() => {
      console.log('timeout', chain, key);
      resolve([_api, timeoutMessage]);
      logFail = false;

      _api.disconnect().catch(console.error);
      _api.off('disconnected', handlerOnFail);
      _api.off('error', handlerOnFail);
    }, 30 * 1000);

    _api.on('disconnected', handlerOnFail);
    _api.on('error', handlerOnFail);

    const temp = await _api.isReady;

    logFail = false;

    _api.off('disconnected', handlerOnFail);
    _api.off('error', handlerOnFail);
    clearTimeout(timeout);

    const tempHash = temp.genesisHash.toHex();

    if (hash && hash !== tempHash) {
      resolve([_api, 'Wrong genesisHash']);
    }

    resolve([_api, '']);
  });
};

export const evmHandleConnectChain = async (chain: string, key: string, provider: string, chainId: number): Promise<[_EvmApi | null, string]> => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
  return new Promise<[_EvmApi | null, string]>(async (resolve) => {
    console.log('start', chain, key, provider);

    let api: _EvmApi | null = null;

    const _api = new EvmApi(chain, provider, { providerName: key });

    let logFail = true;

    const handlerOnFail = (e: Error) => {
      if (logFail) {
        console.log('error', chain, key);
        resolve([api, e?.message || failedMessage]);
      }

      logFail = false;
    };

    const timeout = setTimeout(() => {
      console.log('timeout', chain, key);
      resolve([api, timeoutMessage]);
      logFail = false;

      _api.destroy().catch(console.error);
    }, 60 * 1000);

    try {
      api = await _api.isReady;
    } catch (e) {
      handlerOnFail(e as Error);
    }

    logFail = false;

    clearTimeout(timeout);

    const tempId = await _api.api.eth.getChainId();

    if (tempId !== chainId) {
      resolve([api, 'Wrong chain id']);
    }

    resolve([api, '']);
  });
};
