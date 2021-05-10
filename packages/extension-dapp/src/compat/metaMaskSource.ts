// Copyright 2019-2020 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Injected, InjectedAccount, InjectedWindow } from '@polkadot/extension-inject/types';

import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';

import { SignerPayloadRaw, SignerResult } from '@polkadot/types/types';

interface RequestArguments {
  method: string;
  params?: unknown[];
}

interface EthRpcSubscription {
  unsubscribe: () => void
}

interface EthereumProvider {
  request: (args: RequestArguments) => Promise<any>;
  isMetaMask: boolean;
  on: (name: string, cb: any) => EthRpcSubscription;
}

interface Web3Window extends InjectedWindow {
  web3: Web3; // TODO: this could probably be removed
  // this is injected by metaMask
  ethereum: any;
}

function isMetaMaskProvider (prov: unknown): EthereumProvider {
  if (prov !== null) {
    return (prov as EthereumProvider);
  } else {
    throw new Error('Injected provider is not MetaMask');
  }
}

// transfor the Web3 accounts into a simple address/name array
function transformAccounts (accounts: string[]): InjectedAccount[] {
  return accounts.map((acc, i) => {
    return { address: acc, name: 'MetaMask Address #' + i.toString(), type: 'ethereum' };
  });
}

// add a compat interface of SingleSource to window.injectedWeb3
function injectMetaMaskWeb3 (win: Web3Window): void {
  // decorate the compat interface
  win.injectedWeb3.Web3Source = {
    enable: async (_: string): Promise<Injected> => {
      win.web3 = new Web3(win.ethereum);

      const providerRaw: unknown = await detectEthereumProvider({ mustBeMetaMask: true });
      const provider: EthereumProvider = isMetaMaskProvider(providerRaw);

      await provider.request({ method: 'eth_requestAccounts' });

      return {
        accounts: {
          get: async (): Promise<InjectedAccount[]> => {
            console.log('fetching accounts');

            return transformAccounts(await provider.request({ method: 'eth_requestAccounts' }));
          },
          subscribe: (cb: (accounts: InjectedAccount[]) => void): (() => void) => {
            const sub = provider.on('accountsChanged', function (accounts: string[]) {
              cb(transformAccounts(accounts));
            });
            // TODO: add onchainchanged

            return (): void => {
              sub.unsubscribe();
            };
          }
        },
        signer: {
          signRaw: async (raw: SignerPayloadRaw): Promise<SignerResult> => {
            const signature = (await provider.request({ method: 'eth_sign', params: [raw.address, Web3.utils.sha3(raw.data)] })as string);

            return { id: 0, signature };
          }
        }
      };
    },
    version: win.web3.version
  };
}

// returns the MetaMask source instance, as per
// https://github.com/cennznet/singlesource-extension/blob/f7cb35b54e820bf46339f6b88ffede1b8e140de0/react-example/src/App.js#L19
export default function initMetaMaskSource (): Promise<boolean> {
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
