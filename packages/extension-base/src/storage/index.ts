// Copyright 2019-2022 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export class SWStorage {
  private _storage = {} as Record<string, string>;

  constructor () {
    this.sync();
  }

  setItem (key: string, value: string) {
    this._storage[key] = value;
    localStorage.setItem(key, value);
  }

  getItem (key: string): string | null {
    return this._storage[key] || localStorage.getItem(key) || null;
  }

  removeItem (key: string) {
    this._storage[key] && delete this._storage[key];
    localStorage.removeItem(key);
  }

  clear () {
    this._storage = {};
    localStorage.clear();
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
    this._storage = JSON.parse(JSON.stringify(localStorage)) as Record<string, string>;
  }

  static get instance () {
    // @ts-ignore
    if (!window.SWStorage) {
      console.log('SWStorage init');
      // @ts-ignore
      window.SWStorage = new SWStorage();
    }

    // @ts-ignore
    return window.SWStorage as SWStorage;
  }
}
