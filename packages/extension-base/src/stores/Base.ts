// Copyright 2019-2024 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* global chrome */

type StoreValue = Record<string, unknown>;

const lastError = (type: string): void => {
  const error = chrome.runtime.lastError;

  if (error) {
    console.error(`BaseStore.${type}:: runtime.lastError:`, error);
  }
};

export default abstract class BaseStore <T> {
  #prefix: string;

  constructor (prefix: string | null) {
    this.#prefix = prefix ? `${prefix}:` : '';
  }

  public async all (update: (key: string, value: T) => void): Promise<void> {
    await this.allMap((map): void => {
      Object.entries(map).forEach(([key, value]): void => {
        update(key, value);
      });
    });
  }

  public async allMap (update: (value: Record<string, T>) => void): Promise<void> {
    await chrome.storage.local.get(null).then((result: StoreValue) => {
      lastError('all');

      const entries = Object.entries(result);
      const map: Record<string, T> = {};

      for (let i = 0, count = entries.length; i < count; i++) {
        const [key, value] = entries[i];

        if (key.startsWith(this.#prefix)) {
          map[key.replace(this.#prefix, '')] = value as T;
        }
      }

      update(map);
    });
  }

  public async get (key: string, update: (value: T) => void): Promise<void> {
    const prefixedKey = `${this.#prefix}${key}`;

    await chrome.storage.local.get([prefixedKey]).then((result: StoreValue) => {
      lastError('get');

      update(result[prefixedKey] as T);
    });
  }

  public async remove (key: string, update?: () => void): Promise<void> {
    const prefixedKey = `${this.#prefix}${key}`;

    await chrome.storage.local.remove(prefixedKey).then(() => {
      lastError('remove');

      update && update();
    });
  }

  public async set (key: string, value: T, update?: () => void): Promise<void> {
    const prefixedKey = `${this.#prefix}${key}`;

    await chrome.storage.local.set({ [prefixedKey]: value }).then(() => {
      lastError('set');

      update && update();
    });
  }
}
