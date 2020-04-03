// Copyright 2019 @polkadot/extension-chains authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

type StorageInterface = typeof chrome.storage.local;

export default abstract class BaseStore {
  protected _storage: StorageInterface;

  constructor () {
    this._storage = typeof chrome !== 'undefined'
      ? chrome.storage.local
      : browser.storage.local as unknown as StorageInterface;
  }
}
