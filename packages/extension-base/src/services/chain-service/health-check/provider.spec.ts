// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoMap } from '@subwallet/chain-list';
import { _ChainStatus } from '@subwallet/chain-list/types';
import { EvmApi } from '@subwallet/extension-base/services/chain-service/handler/EvmApi';
import { SubstrateApi } from '@subwallet/extension-base/services/chain-service/handler/SubstrateApi';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';

import { cryptoWaitReady } from '@polkadot/util-crypto';

jest.setTimeout(3 * 60 * 60 * 1000);

const failedMessage = 'Connect failed';
const timeoutMessage = 'Connect timeout';

const substrateHandleConnectChain = async (chain: string, key: string, provider: string): Promise<[_SubstrateApi | null, string]> => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
  return new Promise<[_SubstrateApi | null, string]>(async (resolve) => {
    console.log('start', chain, key, provider);

    let api: _SubstrateApi | null = null;

    const _api = new SubstrateApi(chain, provider, { providerName: key });

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
      _api.api.off('disconnected', handlerOnFail);
      _api.api.off('error', handlerOnFail);
    }, 30 * 1000);

    _api.api.on('disconnected', handlerOnFail);
    _api.api.on('error', handlerOnFail);

    api = await _api.isReady;

    logFail = false;

    _api.api.off('disconnected', handlerOnFail);
    _api.api.off('error', handlerOnFail);
    clearTimeout(timeout);

    resolve([api, '']);
  });
};

const evmHandleConnectChain = async (chain: string, key: string, provider: string): Promise<[_EvmApi | null, string]> => {
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

    resolve([api, '']);
  });
};

describe('test chain provider', () => {
  beforeAll(async () => {
    await cryptoWaitReady();
  });

  it('substrate provider', async () => {
    const chainList = Object.values(ChainInfoMap).filter((info) => info.chainStatus === _ChainStatus.ACTIVE && !!info.substrateInfo);

    const errorProvider: Record<string, Array<[string, string, string]>> = {};
    const timeoutProvider: Record<string, Array<[string, string]>> = {};
    const wrongProvider: Record<string, Array<[string, string]>> = {};
    const notFoundProvider: string[] = [];

    const startIndex = 0;

    try {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
      await new Promise<void>(async (resolve, reject) => {
        const timeHandler = (chain: string, key: string, provider: string) => {
          reject(Error(['Time out on', chain, key, provider].join(' - ')));
        };

        for (let i = startIndex; i < chainList.length; i++) {
          const info = chainList[i];
          const chain = info.slug;
          const noProvider = !Object.keys(info.providers).length;

          console.log('current', i);
          console.log(chain, 'start');

          if (!noProvider) {
            for (const [key, provider] of Object.entries(info.providers)) {
              if (provider.startsWith('wss://')) {
                const timeout = setTimeout(() => {
                  timeHandler(chain, key, provider);
                }, 60 * 1000);
                const [api, message] = await substrateHandleConnectChain(chain, key, provider);

                if (message === timeoutMessage) {
                  const value: [string, string] = [key, provider];

                  timeoutProvider[chain] = timeoutProvider[chain] ? [...timeoutProvider[chain], value] : [value];
                } else if (message) {
                  const value: [string, string, string] = [key, provider, message];

                  errorProvider[chain] = errorProvider[chain] ? [...errorProvider[chain], value] : [value];
                }

                await api?.destroy();

                clearTimeout(timeout);
              } else {
                if (!provider.startsWith('light://')) {
                  const value: [string, string] = [key, provider];

                  wrongProvider[chain] = wrongProvider[chain] ? [...wrongProvider[chain], value] : [value];
                }
              }
            }
          } else {
            notFoundProvider.push(chain);
          }
        }

        resolve();
      });
    } catch (e) {
      console.log(e);
    }

    console.log('error result', JSON.stringify(errorProvider, undefined, 2));
    console.log('timeout result', JSON.stringify(timeoutProvider, undefined, 2));
    console.log('wrong result', JSON.stringify(wrongProvider, undefined, 2));
    console.log('notFound result', JSON.stringify(notFoundProvider, undefined, 2));
  });

  it('evm provider', async () => {
    const chainList = Object.values(ChainInfoMap).filter((info) => info.chainStatus === _ChainStatus.ACTIVE && !!info.evmInfo);

    const errorProvider: Record<string, Array<[string, string, string]>> = {};
    const timeoutProvider: Record<string, Array<[string, string]>> = {};
    const notFoundProvider: string[] = [];

    const startIndex = 0;

    try {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
      await new Promise<void>(async (resolve, reject) => {
        const timeHandler = (chain: string, key: string, provider: string) => {
          reject(Error(['Time out on', chain, key, provider].join(' - ')));
        };

        for (let i = startIndex; i < chainList.length; i++) {
          const info = chainList[i];
          const chain = info.slug;
          const noProvider = !Object.keys(info.providers).length;

          console.log('current', i);
          console.log(chain, 'start');

          if (!noProvider) {
            for (const [key, provider] of Object.entries(info.providers)) {
              if (!provider.startsWith('light://')) {
                const timeout = setTimeout(() => {
                  timeHandler(chain, key, provider);
                }, 2 * 60 * 1000);
                const [api, message] = await evmHandleConnectChain(chain, key, provider);

                if (message === timeoutMessage) {
                  const value: [string, string] = [key, provider];

                  timeoutProvider[chain] = timeoutProvider[chain] ? [...timeoutProvider[chain], value] : [value];
                } else if (message) {
                  const value: [string, string, string] = [key, provider, message];

                  errorProvider[chain] = errorProvider[chain] ? [...errorProvider[chain], value] : [value];
                }

                await api?.destroy();

                clearTimeout(timeout);
              }
            }
          } else {
            notFoundProvider.push(chain);
          }
        }

        resolve();
      });
    } catch (e) {
      console.log(e);
    }

    console.log('error result', JSON.stringify(errorProvider, undefined, 2));
    console.log('timeout result', JSON.stringify(timeoutProvider, undefined, 2));
    console.log('notFound result', JSON.stringify(notFoundProvider, undefined, 2));
  });
});
