// Copyright 2019 @polkadot/extension-bg authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringStore } from '@polkadot/ui-keyring/types';

const lastError = (type: string): void => {
  const error = chrome.runtime.lastError;

  if (error) {
    console.error(`ChromeStore.${type}:: chrome.runtime.lastError:`, error);
  }
};

export default class ChromeStore implements KeyringStore {
  all (cb: (key: string, value: any) => void): void {
    chrome.storage.local.get(null, (result: { [index: string]: any }) => {
      lastError('all');

      Object.entries(result).forEach(([key, value]) =>
        cb(key, value)
      );
    });
  }

  get (key: string, cb: (value: any) => void): void {
    chrome.storage.local.get([key], (result: { [index: string]: any }) => {
      lastError('get');

      cb(result[key]);
    });
  }

  remove (key: string, cb?: () => void): void {
    chrome.storage.local.remove(key, () => {
      lastError('remove');

      cb && cb();
    });
  }

  set (key: string, value: any, cb?: () => void): void {
    // shortcut, don't save testing accounts in storage
    if (key.indexOf('account:') === 0 && value.meta && value.meta.isTesting) {
      cb && cb();

      return;
    }

    chrome.storage.local.set({ [key]: value }, () => {
      lastError('set');

      cb && cb();
    });
  }
}
