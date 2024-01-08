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

  public all (update: (key: string, value: T) => void): void {
    this.allMap((map): void => {
      Object.entries(map).forEach(([key, value]): void => {
        update(key, value);
      });
    });
  }

  public allMap (update: (value: Record<string, T>) => void): void {
    chrome.storage.local.get(null, (result: StoreValue): void => {
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

  public get (key: string, update: (value: T) => void): void {
    const prefixedKey = `${this.#prefix}${key}`;

    chrome.storage.local.get([prefixedKey], (result: StoreValue): void => {
      lastError('get');

      update(result[prefixedKey] as T);
    });
  }

  public remove (key: string, update?: () => void): void {
    const prefixedKey = `${this.#prefix}${key}`;

    chrome.storage.local.remove(prefixedKey, (): void => {
      lastError('remove');

      update && update();
    });
  }

  public set (key: string, value: T, update?: () => void): void {
    const prefixedKey = `${this.#prefix}${key}`;

    chrome.storage.local.set({ [prefixedKey]: value }, (): void => {
      lastError('set');

      update && update();
    });
  }
}
