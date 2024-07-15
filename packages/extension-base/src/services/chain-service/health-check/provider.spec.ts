// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoMap } from '@subwallet/chain-list';
import { _ChainStatus } from '@subwallet/chain-list/types';

import { cryptoWaitReady } from '@polkadot/util-crypto';

import { evmHandleConnectChain, substrateHandleConnectChain, timeoutMessage } from './utils';

jest.setTimeout(3 * 60 * 60 * 1000);

describe('test chain provider', () => {
  beforeAll(async () => {
    await cryptoWaitReady();
  });

  it('substrate provider', async () => {
    const chainList = Object.values(ChainInfoMap).filter((info) =>
      info.chainStatus === _ChainStatus.ACTIVE && !!info.substrateInfo
      // && ['westend', 'edgeware', 'interlay', 'basilisk', 'zeitgeist', 'logion', 'phykenTest'].includes(info.slug)
    );

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
                const [api, message] = await substrateHandleConnectChain(chain, key, provider, info.substrateInfo?.genesisHash || '');

                if (message === timeoutMessage) {
                  const value: [string, string] = [key, provider];

                  timeoutProvider[chain] = timeoutProvider[chain] ? [...timeoutProvider[chain], value] : [value];
                } else if (message) {
                  const value: [string, string, string] = [key, provider, message];

                  errorProvider[chain] = errorProvider[chain] ? [...errorProvider[chain], value] : [value];
                }

                clearTimeout(timeout);

                await api?.disconnect();
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
                const [api, message] = await evmHandleConnectChain(chain, key, provider, info.evmInfo?.evmChainId || 0);

                if (message === timeoutMessage) {
                  const value: [string, string] = [key, provider];

                  timeoutProvider[chain] = timeoutProvider[chain] ? [...timeoutProvider[chain], value] : [value];
                } else if (message) {
                  const value: [string, string, string] = [key, provider, message];

                  errorProvider[chain] = errorProvider[chain] ? [...errorProvider[chain], value] : [value];
                }

                clearTimeout(timeout);

                await api?.destroy();
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
