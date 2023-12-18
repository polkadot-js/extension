// Copyright 2019-2022 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { xglobal } from '@polkadot/x-global';

const hasLocalStorage = typeof localStorage !== 'undefined';

// Create localStorage adaptor
export class SWStorage {
  private _storage = {} as Record<string, string>;
  // Todo: MV3 fix this
  private localStorage = hasLocalStorage ? localStorage : null;

  constructor () {
    this.sync();
  }

  setItem (key: string, value: string) {
    this._storage[key] = value;
    this.localStorage?.setItem(key, value);
  }

  getItem (key: string): string | null {
    return this._storage[key] || this.localStorage?.getItem(key) || null;
  }

  removeItem (key: string) {
    this._storage[key] && delete this._storage[key];
    this.localStorage?.removeItem(key);
  }

  clear () {
    this._storage = {};
    this.localStorage?.clear();
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

  sync () {
    if (hasLocalStorage) {
      this._storage = JSON.parse(JSON.stringify(this.localStorage)) as Record<string, string>;
    } else {
      this._storage = {};
    }
  }

  static get instance () {
    if (!xglobal.SWStorage) {
      xglobal.SWStorage = new SWStorage();
    }

    return xglobal.SWStorage as SWStorage;
  }
}
