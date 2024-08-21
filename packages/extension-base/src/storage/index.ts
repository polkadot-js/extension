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
  private isReady = false;
  private waitReadyHandler = createPromiseHandler<SWStorage>();

  public get waitReady () {
    return this.waitReadyHandler.promise;
  }

  constructor () {
    this.sync()
      .then(() => {
        this.isReady = true;
        this.waitReadyHandler.resolve(this);
      })
      .catch(console.error);
  }

  async setItem (key: string, value: string) {
    !this.isReady && await this.waitReady;
    this._storage[key] = value;

    if (this.localStorage) {
      this.localStorage?.setItem(key, value);
    } else {
      this.kvDatabase.put({ key, value }).catch(console.error);
    }
  }

  async getEntries () {
    !this.isReady && await this.waitReady;

    return Object.entries(this._storage);
  }

  async setMap (map: Record<string, string>) {
    !this.isReady && await this.waitReady;
    this._storage = { ...this._storage, ...map };

    if (this.localStorage) {
      Object.entries(map).forEach(([key, value]) => {
        this.localStorage?.setItem(key, value);
      });
    } else {
      const putList = Object.entries(map).map(([key, value]) => ({ key, value }));

      this.kvDatabase
        .bulkPut(putList)
        .catch(console.error);
    }
  }

  async getItem (key: string): Promise<string | null> {
    !this.isReady && await this.waitReady;

    return this._storage[key] || null;
  }

  async getItems (keys: string[]): Promise<Array<string | null>> {
    !this.isReady && await this.waitReady;

    return keys.map((key) => this._storage[key] || null);
  }

  async getMap (keys: string[]): Promise<Record<string, string | null>> {
    !this.isReady && await this.waitReady;

    return keys.reduce((result, key) => {
      result[key] = this._storage[key] || null;

      return result;
    }, {} as Record<string, string | null>);
  }

  async removeItem (key: string) {
    !this.isReady && await this.waitReady;
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

  async removeItems (keys: string[]) {
    !this.isReady && await this.waitReady;
    keys.forEach((key) => {
      this._storage[key] && delete this._storage[key];
    });

    if (this.localStorage) {
      keys.forEach((key) => {
        this.localStorage && this.localStorage.removeItem(key);
      });
    } else {
      this.kvDatabase
        .where('key')
        .anyOf(keys)
        .delete()
        .catch(console.error);
    }
  }

  async clear () {
    !this.isReady && await this.waitReady;
    this._storage = {};

    if (this.localStorage) {
      this.localStorage.clear();
    } else {
      this.kvDatabase.clear().catch(console.error);
    }
  }

  async key (index: number): Promise<string | null> {
    !this.isReady && await this.waitReady;

    return Object.keys(this._storage)[index] || null;
  }

  async length (index: number): Promise<string | null> {
    !this.isReady && await this.waitReady;

    return Object.keys(this._storage)[index] || null;
  }

  // Additional methods
  async keys (): Promise<string[]> {
    !this.isReady && await this.waitReady;

    return Object.keys(this._storage) || [];
  }

  async copy (): Promise<Record<string, string>> {
    !this.isReady && await this.waitReady;

    return Promise.resolve(JSON.parse(JSON.stringify(this._storage)) as Record<string, string>);
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
