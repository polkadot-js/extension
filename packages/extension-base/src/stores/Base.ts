// Copyright 2019-2021 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

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
    chrome.storage.local.get(null, (result: StoreValue): void => {
      lastError('all');

      Object
        .entries(result)
        .filter(([key]) => key.startsWith(this.#prefix))
        .forEach(([key, value]): void => {
          update(key.replace(this.#prefix, ''), value as T);
        });
    });
  }

  public get (_key: string, update: (value: T) => void): void {
    const key = `${this.#prefix}${_key}`;

    chrome.storage.local.get([key], (result: StoreValue): void => {
      lastError('get');

      update(result[key] as T);
    });
  }

  public remove (_key: string, update?: () => void): void {
    const key = `${this.#prefix}${_key}`;

    chrome.storage.local.remove(key, (): void => {
      lastError('remove');

      update && update();
    });
  }

  public set (_key: string, value: T, update?: () => void): void {
    const key = `${this.#prefix}${_key}`;

    chrome.storage.local.set({ [key]: value }, (): void => {
      lastError('set');

      update && update();
    });
  }
}
