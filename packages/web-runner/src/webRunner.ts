// Copyright 2019-2022 @subwallet/web-runner authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@subwallet/extension-inject/crossenv';

import { AccountsStore } from '@subwallet/extension-base/stores';
import KeyringStore from '@subwallet/extension-base/stores/Keyring';
import { state as koniState } from '@subwallet/extension-koni-base/background/handlers';
import keyring from '@subwallet/ui-keyring';

import { cryptoWaitReady } from '@polkadot/util-crypto';

import { PageStatus, responseMessage, setupHandlers } from './messageHandle';

responseMessage({ id: '0', response: { status: 'load' } } as PageStatus);

setupHandlers();

// initial setup
cryptoWaitReady()
  .then((): void => {
    console.log('[Mobile] crypto initialized');

    // load all the keyring data
    keyring.loadAll({ store: new AccountsStore(), type: 'sr25519', password_store: new KeyringStore() });

    keyring.restoreKeyringPassword().finally(() => {
      koniState.setKeyringState({
        hasMasterPassword: !!keyring.keyring?.hasMasterPassword,
        isLocked: !!keyring.keyring?.isLocked,
        isReady: true
      });
    });

    responseMessage({ id: '0', response: { status: 'crypto_ready' } } as PageStatus);

    console.log('[Mobile] initialization completed');
  })
  .catch((error): void => {
    console.error('[Mobile] initialization failed', error);
  });
