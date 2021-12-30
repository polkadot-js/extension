// Copyright 2019-2020 @polkadot/extension-compat-metamask authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Injected, InjectedAccount, InjectedWindow } from '@polkadot/extension-inject/types';
import type { SignerPayloadRaw, SignerResult } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';

import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';

import { assert } from '@polkadot/util';

export { packageInfo } from './packageInfo';

interface RequestArguments {
  method: string;
  params?: unknown[];
}

interface EthRpcSubscription {
  unsubscribe: () => void
}

interface EthereumProvider {
  request: (args: RequestArguments) => Promise<unknown>;
  isMetaMask: boolean;
  on: (name: string, cb: (value: unknown) => void) => EthRpcSubscription;
}

interface Web3Window extends InjectedWindow {
  // this is injected by metaMask
  ethereum: unknown;
}

function isMetaMaskProvider (prov: unknown): EthereumProvider {
  assert(prov && (prov as EthereumProvider).isMetaMask, 'Injected provider is not MetaMask');

  return (prov as EthereumProvider);
}

// transform the Web3 accounts into a simple address/name array
function transformAccounts (accounts: string[]): InjectedAccount[] {
  return accounts.map((address, i) => ({
    address,
    name: `MetaMask Address #${i}`,
    type: 'ethereum'
  }));
}

// add a compat interface of metaMaskSource to window.injectedWeb3
function injectMetaMaskWeb3 (win: Web3Window): void {
  // decorate the compat interface
  win.injectedWeb3.Web3Source = {
    enable: async (): Promise<Injected> => {
      const providerRaw = await detectEthereumProvider({ mustBeMetaMask: true });
      const provider = isMetaMaskProvider(providerRaw);

      await provider.request({ method: 'eth_requestAccounts' });

      return {
        accounts: {
          get: async (): Promise<InjectedAccount[]> => {
            const response = (await provider.request({ method: 'eth_requestAccounts' })) as string[];

            return transformAccounts(response);
          },
          subscribe: (cb: (accounts: InjectedAccount[]) => void): (() => void) => {
            const sub = provider.on('accountsChanged', (accounts): void => {
              cb(transformAccounts(accounts as string[]));
            });
            // TODO: add onchainchanged

            return (): void => {
              sub.unsubscribe();
            };
          }
        },
        signer: {
          signRaw: async (raw: SignerPayloadRaw): Promise<SignerResult> => {
            const signature = (await provider.request({ method: 'eth_sign', params: [raw.address, Web3.utils.sha3(raw.data)] })) as HexString;

            return { id: 0, signature };
          }
        }
      };
    },
    version: '0' // TODO: win.ethereum.version
  };
}

export default function initMetaMask (): Promise<boolean> {
  return new Promise((resolve): void => {
    const win = window as Window & Web3Window;

    if (win.ethereum) {
      injectMetaMaskWeb3(win);
      resolve(true);
    } else {
      resolve(false);
    }
  });
}
