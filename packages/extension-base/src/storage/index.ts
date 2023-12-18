// Copyright 2019-2022 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import KoniDatabase from '@subwallet/extension-base/services/storage-service/databases';
import { createPromiseHandler } from '@subwallet/extension-base/utils/promise';

import { xglobal } from '@polkadot/x-global';

const hasLocalStorage = typeof localStorage !== 'undefined';

// Create localStorage adaptor
export class SWStorage {
  private _storage = {} as Record<string, string>;
  private localStorage = hasLocalStorage ? localStorage : undefined;
  private kvDatabase = KoniDatabase.getInstance().keyValue;
  private waitReadyHandler = createPromiseHandler<void>();

  public get waitReady () {
    return this.waitReadyHandler.promise;
  }

  constructor () {
    this.sync()
      .then(() => {
        this.waitReadyHandler.resolve();
      })
      .catch(console.error);
  }

  setItem (key: string, value: string) {
    this._storage[key] = value;

    if (this.localStorage) {
      this.localStorage?.setItem(key, value);
    } else {
      this.kvDatabase.put({ key, value }).catch(console.error);
    }
  }

  getItem (key: string): string | null {
    return this._storage[key] || null;
  }

  removeItem (key: string) {
    this._storage[key] && delete this._storage[key];

    if (this.localStorage) {
      this.localStorage.removeItem(key);
    } else {
      this.kvDatabase
        .where({ key })
        .delete()
        .catch(console.error);
    }
  }

  clear () {
    this._storage = {};

    if (this.localStorage) {
      this.localStorage.clear();
    } else {
      this.kvDatabase.clear().catch(console.error);
    }
  }

  key (index: number): string | null {
    return Object.keys(this._storage)[index] || null;
  }

  length (index: number): string | null {
    return Object.keys(this._storage)[index] || null;
  }

  // Additional methods
  keys (): string[] {
    return Object.keys(this._storage) || [];
  }

  copy (): Record<string, string> {
    return JSON.parse(JSON.stringify(this._storage)) as Record<string, string>;
  }

  async sync () {
    if (this.localStorage) {
      this._storage = JSON.parse(JSON.stringify(this.localStorage)) as Record<string, string>;
    } else {
      const items = await this.kvDatabase.toArray();

      this._storage = {};
      items.forEach((item) => {
        this._storage[item.key] = item.value;
      });
    }
  }

  static get instance () {
    if (!xglobal.SWStorage) {
      xglobal.SWStorage = new SWStorage();
    }

    return xglobal.SWStorage as SWStorage;
  }
}
