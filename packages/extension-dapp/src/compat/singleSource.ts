// Copyright 2019-2021 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signer } from '@polkadot/api/types';
import type { Injected, InjectedAccount, InjectedWindow } from '@polkadot/extension-inject/types';

// RxJs interface, only the bare-bones of what we need here
interface Subscriber<T> {
  subscribe: (cb: (value: T) => void) => {
    unsubscribe (): void;
  };
}

interface SingleSourceAccount {
  address: string;
  assets: { assetId: number }[];
  name: string;
}

interface SingleSource {
  accounts$: Subscriber<SingleSourceAccount[]>;
  environment$: string[];
  signer: Signer;
}

interface SingleWindow extends InjectedWindow {
  SingleSource: SingleSource;
}

// transfor the SingleSource accounts into a simple address/name array
function transformAccounts (accounts: SingleSourceAccount[]): InjectedAccount[] {
  return accounts.map(({ address, name }): InjectedAccount => ({
    address,
    name,
    type: 'ethereum'
  }));
}

// add a compat interface of SingleSource to window.injectedWeb3
function injectSingleSource (win: SingleWindow): void {
  let accounts: InjectedAccount[] = [];

  // we don't yet have an accounts subscribe on the interface, simply get the
  // accounts and store them, any get will resolve the last found values
  win.SingleSource.accounts$.subscribe((_accounts): void => {
    accounts = transformAccounts(_accounts);
  });

  // decorate the compat interface
  win.injectedWeb3.SingleSource = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    enable: async (origin: string): Promise<Injected> => ({
      accounts: {
        // eslint-disable-next-line @typescript-eslint/require-await
        get: async (): Promise<InjectedAccount[]> =>
          accounts,
        subscribe: (cb: (accounts: InjectedAccount[]) => void): () => void => {
          const sub = win.SingleSource.accounts$.subscribe((accounts): void => {
            cb(transformAccounts(accounts));
          });

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
  return new Promise((resolve): void => {
    // window.addEventListener('load', (): void => {
    console.log('loading singlesource');
    const win = window as Window & SingleWindow;

    if (win.SingleSource) {
      injectSingleSource(win);
      resolve(true);
    } else {
      resolve(false);
    }
    // });
  });
}
