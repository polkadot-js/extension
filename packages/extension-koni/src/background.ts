// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Runs in the extension background, handling all keyring access
import '@subwallet/extension-inject/crossenv';

import type { RequestSignatures, TransportRequestMessage } from '@subwallet/extension-base/background/types';

import { withErrorLog } from '@subwallet/extension-base/background/handlers/helpers';
import { PORT_CONTENT, PORT_EXTENSION } from '@subwallet/extension-base/defaults';
import handlers, { state as koniState } from '@subwallet/extension-base/koni/background/handlers';
import { AccountsStore } from '@subwallet/extension-base/stores';
import KeyringStore from '@subwallet/extension-base/stores/Keyring';
import keyring from '@subwallet/ui-keyring';

import { assert } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';

const IDLE_TIME = 60000 * 2; // 2 minutes

let idleTimer: NodeJS.Timeout;
let waitingToStop = false;
let openCount = 0;
const keyLatestSession = 'general.latest-session';
const timeBackup = 1209600000;
const DEFAULT_LATEST_SESSION = { remind: false, timeCalculate: Date.now(), timeBackup, isFinished: false };

// setup the notification (same a FF default background, white text)
withErrorLog(() => chrome.browserAction.setBadgeBackgroundColor({ color: '#d90000' }));

function handleExtensionIdling () { // handle extension being idle since the init of the extension/browser
  waitingToStop = true;
  idleTimer = setTimeout(() => {
    if (openCount <= 0) {
      koniState.sleep().then(() => {
        waitingToStop = false;
      }).catch((err) => console.warn(err));
    }
  }, IDLE_TIME);
}

function handleRemindUserToExportAccount () {
  koniState.onCheckToRemindUser();
}

handleRemindUserToExportAccount();

// listen to all messages and handle appropriately
chrome.runtime.onConnect.addListener((port): void => {
  // shouldn't happen, however... only listen to what we know about
  assert([PORT_CONTENT, PORT_EXTENSION].includes(port.name), `Unknown connection from ${port.name}`);

  if (PORT_EXTENSION === port.name) {
    openCount += 1;
    koniState.wakeup().catch((err) => console.warn(err));

    if (waitingToStop) {
      clearTimeout(idleTimer);
      waitingToStop = false;
    }
  }

  // message and disconnect handlers
  port.onMessage.addListener((data: TransportRequestMessage<keyof RequestSignatures>) => handlers(data, port));
  port.onDisconnect.addListener(() => {
    const latestSessionRaw = localStorage.getItem(keyLatestSession);

    const latestSession = latestSessionRaw ? JSON.parse(latestSessionRaw) as { remind: boolean, timeCalculate: number } : DEFAULT_LATEST_SESSION;

    localStorage.setItem(keyLatestSession, JSON.stringify({ ...latestSession, remind: true }));

    if (PORT_EXTENSION === port.name) {
      openCount -= 1;

      if (openCount <= 0) {
        waitingToStop = true;
        idleTimer = setTimeout(() => {
          koniState.sleep().then(() => {
            waitingToStop = false;
          }).catch((err) => console.warn(err));
        }, IDLE_TIME);
      }
    }
  });
});

// Trigger single mode
// chrome.runtime.onInstalled.addListener(function (details) {
//   if (details.reason === 'install') {
//     onExtensionInstall();
//   }
// });

// Setup uninstall URL every background start
chrome.runtime.setUninstallURL('https://slink.subwallet.app/uninstall-feedback');

chrome.runtime.onStartup.addListener(function () {
  handleExtensionIdling();
});

// initial setup
cryptoWaitReady()
  .then((): void => {
    // load all the keyring data
    keyring.loadAll({ store: new AccountsStore(), type: 'sr25519', password_store: new KeyringStore() });

    keyring.restoreKeyringPassword().finally(() => {
      koniState.updateKeyringState();
    });
    koniState.eventService.emit('crypto.ready', true);

    // Sleep extension after 2 minutes of inactivity or without any action
    handleExtensionIdling();
  })
  .catch((error): void => {
    console.error('initialization failed', error);
  });
