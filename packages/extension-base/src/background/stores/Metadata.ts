// Copyright 2019 @polkadot/extension-base authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MetadataDef } from '@polkadot/extension-inject/types';

import chrome from '@polkadot/extension-base/chrome';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StoreValue = Record<string, any>;

const lastError = (type: string): void => {
  const error = chrome.runtime.lastError;

  if (error) {
    console.error(`MetadataStore.${type}:: runtime.lastError:`, error);
  }
};

export default class MetadataStore {
  public all (cb: (key: string, value: MetadataDef) => void): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chrome.storage.local.get(null, (result: StoreValue): void => {
      lastError('all');

      Object.entries(result).forEach(([key, value]): void => {
        cb(key, value);
      });
    });
  }

  public get (key: string, cb: (value: MetadataDef) => void): void {
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

  public set (key: string, value: MetadataDef, cb?: () => void): void {
    chrome.storage.local.set({ [key]: value }, (): void => {
      lastError('set');

      cb && cb();
    });
  }
}
