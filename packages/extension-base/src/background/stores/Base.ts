// Copyright 2019 @polkadot/extension-base authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import chrome from '../../chrome';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StoreValue = Record<string, any>;

const lastError = (type: string): void => {
  const error = chrome.runtime.lastError;

  if (error) {
    console.error(`BaseStore.${type}:: runtime.lastError:`, error);
  }
};

export default abstract class BaseStore {
  #prefix: string;

  constructor (prefix: string) {
    this.#prefix = `${prefix}:`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public all (cb: (key: string, value: any) => void): void {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get (_key: string, cb: (value: any) => void): void {
    const key = `${this.#prefix}${_key}`;

    chrome.storage.local.get([key], (result: StoreValue): void => {
      lastError('get');

      cb(result[key]);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public remove (_key: string, cb?: () => void): void {
    const key = `${this.#prefix}${_key}`;

    chrome.storage.local.remove(key, (): void => {
      lastError('remove');

      cb && cb();
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public set (_key: string, value: any, cb?: () => void): void {
    const key = `${this.#prefix}${_key}`;

    chrome.storage.local.set({ [key]: value }, (): void => {
      lastError('set');

      cb && cb();
    });
  }
}
