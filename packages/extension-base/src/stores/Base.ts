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
    await this.allMap(async (map): Promise<void> => {
      const entries = Object.entries(map);

      for (const [key, value] of entries) {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await update(key, value);
      }
    });
  }

  public async allMap (update: (value: Record<string, T>) => Promise<void>): Promise<void> {
    await chrome.storage.local.get(null).then(async (result: StoreValue) => {
      lastError('all');

      const entries = Object.entries(result);
      const map: Record<string, T> = {};

      for (let i = 0, count = entries.length; i < count; i++) {
        const [key, value] = entries[i];

        if (key.startsWith(this.#prefix)) {
          map[key.replace(this.#prefix, '')] = value as T;
        }
      }

      await update(map);
    }).catch(({ message }: Error) => {
      console.error(`BaseStore error within allMap: ${message}`);
    });
  }

  public async get (key: string, update: (value: T) => void): Promise<void> {
    const prefixedKey = `${this.#prefix}${key}`;

    await chrome.storage.local.get([prefixedKey]).then(async (result: StoreValue) => {
      lastError('get');

      // eslint-disable-next-line @typescript-eslint/await-thenable
      await update(result[prefixedKey] as T);
    }).catch(({ message }: Error) => {
      console.error(`BaseStore error within get: ${message}`);
    });
  }

  public async remove (key: string, update?: () => void): Promise<void> {
    const prefixedKey = `${this.#prefix}${key}`;

    await chrome.storage.local.remove(prefixedKey).then(async () => {
      lastError('remove');

      // eslint-disable-next-line @typescript-eslint/await-thenable
      update && await update();
    }).catch(({ message }: Error) => {
      console.error(`BaseStore error within remove: ${message}`);
    });
  }

  public async set (key: string, value: T, update?: () => void): Promise<void> {
    const prefixedKey = `${this.#prefix}${key}`;

    await chrome.storage.local.set({ [prefixedKey]: value }).then(async () => {
      lastError('set');

      // eslint-disable-next-line @typescript-eslint/await-thenable
      update && await update();
    }).catch(({ message }: Error) => {
      console.error(`BaseStore error within set: ${message}`);
    });
  }
}
