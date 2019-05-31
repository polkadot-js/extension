// Copyright 2019 @polkadot/extension-dapp authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Signer } from '@polkadot/api/types';
import { InjectedAccount, InjectedWindow } from '../types';

// RxJs interface, only the bare-bones of what we need here
type Subscriber<T> = {
  subscribe: (cb: (value: T) => void) => {
    unsubscribe (): any
  }
};

type SingleSourceAccount = {
  address: string,
  assets: Array<{ assetId: number }>,
  name: string
};

type SingleSource = {
  accounts$: Subscriber<Array<SingleSourceAccount>>,
  environment$: Subscriber<string>,
  signer: Signer
};

type SingleWindow = Window & InjectedWindow & {
  SingleSource: SingleSource
};

// transfor the SingleSource accounts into a simple address/name array
function transformAccounts (accounts: Array<SingleSourceAccount>): Array<InjectedAccount> {
  return accounts.map(({ address, name }) => ({
    address,
    name
  }));
}

// add a compat interface of SingleSource to window.injectedWeb3
function injectSingleSource (win: SingleWindow): void {
  let accounts: Array<InjectedAccount> = [];

  // we don't yet have an accounts subscribe on the interface, simply get the
  // accounts and store them, any get will resolve the last found values
  win.SingleSource.accounts$.subscribe((_accounts) => {
    accounts = transformAccounts(_accounts);
  });

  // decorate the compat interface
  win.injectedWeb3['SingleSource'] = {
    enable: async (origin: string) => ({
      accounts: {
        get: async () =>
          accounts,
        subscribe: (cb: (accounts: Array<InjectedAccount>) => any) => {
          const sub = win.SingleSource.accounts$.subscribe((accounts) =>
            cb(transformAccounts(accounts))
          );

          return (): void => {
            sub.unsubscribe();
          };
        }
      },
      signer: win.SingleSource.signer
    }),
    version: '0.0.0'
  };
}

// returns the SingleSource instance, as per
// https://github.com/cennznet/singlesource-extension/blob/f7cb35b54e820bf46339f6b88ffede1b8e140de0/react-example/src/App.js#L19
export default function initSingleSource (): Promise<boolean> {
  return new Promise((resolve) => {
    window.addEventListener('load', () => {
      const win = window as SingleWindow;

      if (win.SingleSource) {
        injectSingleSource(win);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}
