// Copyright 2019-2020 @polkadot/extension-base authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringStore, KeyringJson } from '@polkadot/ui-keyring/types';

import BaseStore from './Base';

export default class AccountsStore extends BaseStore implements KeyringStore {
  constructor () {
    super(null);
  }

  public all (cb: (key: string, value: KeyringJson) => void): void {
    super.all(cb);
  }

  public get (key: string, cb: (value: KeyringJson) => void): void {
    super.get(key, cb);
  }

  public remove (key: string, cb?: () => void): void {
    super.remove(key, cb);
  }

  public set (key: string, value: KeyringJson, cb?: () => void): void {
    // shortcut, don't save testing accounts in extension storage
    if (key.startsWith('account:') && value.meta && value.meta.isTesting) {
      cb && cb();

      return;
    }

    super.set(key, value, cb);
  }
}
