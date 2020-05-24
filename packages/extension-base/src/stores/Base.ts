// Copyright 2019-2020 @polkadot/extension-base authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import chrome from '@polkadot/extension-inject/chrome';

type StoreValue = Record<string, unknown>;

const lastError = (type: string): void => {
  const error = chrome.runtime.lastError;

  if (error) {
    console.error(`BaseStore.${type}:: runtime.lastError:`, error);
  }
};

export default abstract class BaseStore {
  #prefix: string;

  constructor (prefix: string | null) {
    this.#prefix = prefix ? `${prefix}:` : '';
  }

  public all (cb: (key: string, value: unknown) => void): void {
    chrome.storage.local.get(null, (result: StoreValue): void => {
      lastError('all');

      Object
        .entries(result)
        .filter(([key]) => key.startsWith(this.#prefix))
        .forEach(([key, value]): void => {
          cb(key.replace(this.#prefix, ''), value);
        });
    });
  }

  public get (_key: string, cb: (value: unknown) => void): void {
    const key = `${this.#prefix}${_key}`;

    chrome.storage.local.get([key], (result: StoreValue): void => {
      lastError('get');

      cb(result[key]);
    });
  }

  public remove (_key: string, cb?: () => void): void {
    const key = `${this.#prefix}${_key}`;

    chrome.storage.local.remove(key, (): void => {
      lastError('remove');

      cb && cb();
    });
  }

  public set (_key: string, value: unknown, cb?: () => void): void {
    const key = `${this.#prefix}${_key}`;

    chrome.storage.local.set({ [key]: value }, (): void => {
      lastError('set');

      cb && cb();
    });
  }
}
