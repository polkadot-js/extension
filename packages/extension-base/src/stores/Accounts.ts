// Copyright 2019-2024 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringJson, KeyringStore } from '@polkadot/ui-keyring/types';

import { EXTENSION_PREFIX } from '../defaults.js';
import BaseStore from './Base.js';

export default class AccountsStore extends BaseStore<KeyringJson> implements KeyringStore {
  constructor () {
    super(
      EXTENSION_PREFIX && EXTENSION_PREFIX !== 'polkadot{.js}'
        ? `${EXTENSION_PREFIX}accounts`
        : null
    );
  }

  public override set (key: string, value: KeyringJson, update?: () => void): void {
    // shortcut, don't save testing accounts in extension storage
    if (key.startsWith('account:') && value.meta && value.meta.isTesting) {
      update && update();

      return;
    }

    super.set(key, value, update);
  }
}
