// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Runs in the extension background, handling all keyring access
import '@subwallet/extension-inject/crossenv';

import handlers, { state as koniState, state } from '@subwallet/extension-base/koni/background/handlers';
import { AccountsStore } from '@subwallet/extension-base/stores';
import KeyringStore from '@subwallet/extension-base/stores/Keyring';
import { ActionHandler } from '@subwallet/extension-koni/helper/ActionHandler';
import keyring from '@subwallet/ui-keyring';

import { cryptoWaitReady } from '@polkadot/util-crypto';

// Set handler
const actionHandler = ActionHandler.getInstance();

actionHandler.setPortHandler(handlers);
actionHandler.setInstallHandler(state.onInstallOrUpdate.bind(state));
actionHandler.setSleepHandler(state.sleep.bind(state));
actionHandler.setWakeUpHandler(state.wakeup.bind(state));

Promise.all([cryptoWaitReady(), actionHandler.waitFirstActiveMessage])
  .then((): void => {
    // load all the keyring data
    keyring.loadAll({ store: new AccountsStore(), type: 'sr25519', password_store: new KeyringStore() });

    keyring.restoreKeyringPassword().finally(() => {
      koniState.updateKeyringState();
    });
    koniState.eventService.emit('crypto.ready', true);
    koniState.init().catch(console.error);
  })
  .catch((error): void => {
    console.error('initialization fail', error);
  });
