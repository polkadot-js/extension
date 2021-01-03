// Copyright 2019-2021 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringJson, KeyringStore } from '@polkadot/ui-keyring/types';

import BaseStore from './Base';

export default class AccountsStore extends BaseStore<KeyringJson> implements KeyringStore {
  constructor () {
    super(null);
  }

  public all (cb: (key: string, value: KeyringJson) => void): void {
    super.all(cb);
  }

  public get (key: string, update: (value: KeyringJson) => void): void {
    super.get(key, update);
  }

  public remove (key: string, update?: () => void): void {
    super.remove(key, update);
  }

  public set (key: string, value: KeyringJson, update?: () => void): void {
    // shortcut, don't save testing accounts in extension storage
    if (key.startsWith('account:') && value.meta && value.meta.isTesting) {
      update && update();

      return;
    }

    super.set(key, value, update);
  }
}
