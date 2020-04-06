// Copyright 2019 @polkadot/ui-keyring authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringStore, KeyringJson } from '@polkadot/ui-keyring/types';

import chrome from '../../chrome';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StoreValue = Record<string, any>;

const lastError = (type: string): void => {
  const error = chrome.runtime.lastError;

  if (error) {
    console.error(`ExtensionStore.${type}:: runtime.lastError:`, error);
  }
};

export default class AccountsStore implements KeyringStore {
  public all (cb: (key: string, value: KeyringJson) => void): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chrome.storage.local.get(null, (result: StoreValue): void => {
      lastError('all');

      Object.entries(result).forEach(([key, value]): void => {
        cb(key, value);
      });
    });
  }

  public get (key: string, cb: (value: KeyringJson) => void): void {
    chrome.storage.local.get([key], (result: StoreValue): void => {
      lastError('get');

      cb(result[key]);
    });
  }

  public remove (key: string, cb?: () => void): void {
    chrome.storage.local.remove(key, (): void => {
      lastError('remove');

      cb && cb();
    });
  }

  public set (key: string, value: KeyringJson, cb?: () => void): void {
    // shortcut, don't save testing accounts in extension storage
    if (key.startsWith('account:') && value.meta && value.meta.isTesting) {
      cb && cb();

      return;
    }

    chrome.storage.local.set({ [key]: value }, (): void => {
      lastError('set');

      cb && cb();
    });
  }
}
