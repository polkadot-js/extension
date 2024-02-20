// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmApi } from '@subwallet/extension-base/services/chain-service/handler/EvmApi';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { noop } from '@polkadot/util';

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

    const tempHash = temp.genesisHash.toHex();

    if (hash && hash !== tempHash) {
      resolve([_api, 'Wrong genesisHash']);
    }

    await _api.query.system.number();

    _api.off('disconnected', handlerOnFail);
    _api.off('error', handlerOnFail);
    clearTimeout(timeout);

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

interface HandleProviderProp {
  chain: string;
  key: string;
  provider: string;
  onTimeout: () => void;
  awaitDisconnect: boolean;
  onError: (message: string) => Promise<void>;
}

interface HandleSubstrateProviderProp extends HandleProviderProp {
  genHash: string;
  onSuccess: (api: ApiPromise) => Promise<void>;
}

interface HandleEvmProviderProp extends HandleProviderProp {
  chainId: number;
  onSuccess: (api: _EvmApi) => Promise<void>;
}

export const handleSubstrateProvider = ({ awaitDisconnect,
  chain,
  genHash,
  key,
  onError,
  onSuccess,
  onTimeout,
  provider }: HandleSubstrateProviderProp) => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
  return new Promise<void>(async (resolve) => {
    const timeHandler = () => {
      onTimeout();
      resolve();
    };

    const timeout = setTimeout(() => {
      timeHandler();
    }, 2 * 60 * 1000);

    const [api, message] = await substrateHandleConnectChain(chain, key, provider, genHash);

    const disconnectApi = async () => {
      if (awaitDisconnect) {
        await api?.disconnect();
      } else {
        api?.disconnect().finally(noop);
      }
    };

    clearTimeout(timeout);

    if (message) {
      await onError(message);
      await disconnectApi();

      resolve();
    }

    await onSuccess(api);
    await disconnectApi();

    resolve();
  });
};

export const handleEvmProvider = ({ awaitDisconnect,
  chain,
  chainId,
  key,
  onError,
  onSuccess,
  onTimeout,
  provider }: HandleEvmProviderProp) => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
  return new Promise<void>(async (resolve) => {
    const timeHandler = () => {
      onTimeout();
      resolve();
    };

    const timeout = setTimeout(() => {
      timeHandler();
    }, 2 * 60 * 1000);

    const [_api, message] = await evmHandleConnectChain(chain, key, provider, chainId);

    const disconnectApi = async () => {
      if (awaitDisconnect) {
        await api?.destroy();
      } else {
        api?.destroy().finally(noop);
      }
    };

    clearTimeout(timeout);

    if (message) {
      await onError(message);
      await disconnectApi();

      resolve();
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const api = _api!;

    await onSuccess(api);
    await disconnectApi();

    resolve();
  });
};
