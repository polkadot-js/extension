// Copyright 2019-2022 @subwallet/webapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@subwallet/extension-inject/crossenv';

import { SWHandler } from '@subwallet/extension-base/koni/background/handlers';
import { AccountsStore } from '@subwallet/extension-base/stores';
import KeyringStore from '@subwallet/extension-base/stores/Keyring';
import { ENABLE_INJECT } from '@subwallet/extension-web-ui/constants';
import keyring from '@subwallet/ui-keyring';

import { cryptoWaitReady } from '@polkadot/util-crypto';

import { PageStatus, responseMessage, setupHandlers } from './messageHandle';

setupHandlers();

responseMessage({ id: '0', response: { status: 'load' } } as PageStatus);

// initial setup
cryptoWaitReady()
  .then((): void => {
    console.log('[WebApp] crypto initialized');

    // load all the keyring data
    keyring.loadAll({ store: new AccountsStore(), type: 'sr25519', password_store: new KeyringStore() });

    keyring.restoreKeyringPassword().finally(() => {
      SWHandler.instance.state.updateKeyringState();
    });

    const injectedExtension = !!(localStorage.getItem(ENABLE_INJECT) || null);

    if (injectedExtension) {
      const timeout = setTimeout(() => {
        SWHandler.instance.state.eventService.emit('inject.ready', true);
      }, 1000);

      SWHandler.instance.state.eventService.waitInjectReady.then(() => clearTimeout(timeout)).catch(console.error);
    } else {
      SWHandler.instance.state.eventService.emit('inject.ready', true);
    }

    SWHandler.instance.state.eventService.emit('crypto.ready', true);

    responseMessage({ id: '0', response: { status: 'crypto_ready' } } as PageStatus);

    // wake webapp up
    SWHandler.instance.state.wakeup().catch((err) => console.warn(err));

    console.log('[WebApp] initialization completed');
  })
  .catch((error): void => {
    console.error('[WebApp] initialization failed', error);
  });
