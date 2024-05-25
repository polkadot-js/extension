// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Runs in the extension background, handling all keyring access
import '@subwallet/extension-inject/crossenv';

import { SWHandler } from '@subwallet/extension-base/koni/background/handlers';
import { AccountsStore } from '@subwallet/extension-base/stores';
import KeyringStore from '@subwallet/extension-base/stores/Keyring';
import { ActionHandler } from '@subwallet/extension-koni/helper/ActionHandler';
import keyring from '@subwallet/ui-keyring';

import { cryptoWaitReady } from '@polkadot/util-crypto';

const keyLatestSession = 'general.latest-session';
const timeBackup = 300000;
const DEFAULT_LATEST_SESSION = { remind: false, timeCalculate: Date.now(), timeBackup, isFinished: false };

// Set handler
const actionHandler = ActionHandler.instance;

actionHandler.setHandler(SWHandler.instance);


chrome.runtime.onConnect.addListener((port): void => {
  port.onDisconnect.addListener(() => {
    const latestSessionRaw = localStorage.getItem(keyLatestSession);

    const latestSession = latestSessionRaw ? JSON.parse(latestSessionRaw) as { remind: boolean, timeCalculate: number } : DEFAULT_LATEST_SESSION;

    localStorage.setItem(keyLatestSession, JSON.stringify({ ...latestSession, remind: true }));

});

cryptoWaitReady()
  .then((): void => {
    const koniState = SWHandler.instance.state;


    koniState.onCheckToRemindUser();

    // load all the keyring data
    keyring.loadAll({ store: new AccountsStore(), type: 'sr25519', password_store: new KeyringStore() });

    keyring.restoreKeyringPassword().finally(() => {
      koniState.updateKeyringState();
    });
    koniState.eventService.emit('crypto.ready', true);

    // Manual Init koniState
    actionHandler.waitFirstActiveMessage.then(() => {
      koniState.init().catch(console.error);
    }).catch(console.error);
  })
  .catch((error): void => {
    console.error('Initialization fail', error);
  });
