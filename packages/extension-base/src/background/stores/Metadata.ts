// Copyright 2019 @polkadot/extension-chains authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import extension from '@polkadot/extension-base/extension';
import { MetadataDef } from '@polkadot/extension-inject/types';

import BaseStore from './Base';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StoreValue = Record<string, any>;

const lastError = (type: string): void => {
  const error = extension.runtime.lastError;

  if (error) {
    console.error(`MetadataStore.${type}:: runtime.lastError:`, error);
  }
};

export default class MetadataStore extends BaseStore {
  public all (cb: (key: string, value: MetadataDef) => void): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._storage.get(null, (result: StoreValue): void => {
      lastError('all');

      Object.entries(result).forEach(([key, value]): void => {
        cb(key, value);
      });
    });
  }

  public get (key: string, cb: (value: MetadataDef) => void): void {
    this._storage.get([key], (result: StoreValue): void => {
      lastError('get');

      cb(result[key]);
    });
  }

  public remove (key: string, cb?: () => void): void {
    this._storage.remove(key, (): void => {
      lastError('remove');

      cb && cb();
    });
  }

  public set (key: string, value: MetadataDef, cb?: () => void): void {
    this._storage.set({ [key]: value }, (): void => {
      lastError('set');

      cb && cb();
    });
  }
}
