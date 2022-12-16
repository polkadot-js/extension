// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Runs in the extension background, handling all keyring access

import '@subwallet/extension-inject/crossenv';

import type { RequestSignatures, TransportRequestMessage } from '@subwallet/extension-base/background/types';

import { withErrorLog } from '@subwallet/extension-base/background/handlers/helpers';
import { PORT_CONTENT, PORT_EXTENSION } from '@subwallet/extension-base/defaults';
import { AccountsStore } from '@subwallet/extension-base/stores';
import { onExtensionInstall } from '@subwallet/extension-koni-base/background/events';
import handlers, { state as koniState } from '@subwallet/extension-koni-base/background/handlers';

import keyring from '@polkadot/ui-keyring';
import { assert } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';

const IDLE_TIME = 60000 * 2; // 2 minutes

let idleTimer: NodeJS.Timeout;
let waitingToStop = false;
let openCount = 0;

// setup the notification (same a FF default background, white text)
withErrorLog(() => chrome.browserAction.setBadgeBackgroundColor({ color: '#d90000' }));

function handleExtensionIdling () { // handle extension being idle since the init of the extension/browser
  waitingToStop = true;
  idleTimer = setTimeout(() => {
    if (openCount <= 0) {
      koniState.sleep().then(() => {
        waitingToStop = false;

        console.log('Shut down due to popup never opened since init ---------------------------------');
      }).catch((err) => console.warn(err));
    }
  }, IDLE_TIME);
}

// listen to all messages and handle appropriately
chrome.runtime.onConnect.addListener((port): void => {
  // shouldn't happen, however... only listen to what we know about
  assert([PORT_CONTENT, PORT_EXTENSION].includes(port.name), `Unknown connection from ${port.name}`);

  if (PORT_EXTENSION === port.name) {
    openCount += 1;
    koniState.wakeup().catch((err) => console.warn(err));

    console.log('Wake up due to popup open ---------------------------------');

    if (waitingToStop) {
      clearTimeout(idleTimer);
      waitingToStop = false;
    }
  }

  // message and disconnect handlers
  port.onMessage.addListener((data: TransportRequestMessage<keyof RequestSignatures>) => handlers(data, port));
  port.onDisconnect.addListener(() => {
    if (PORT_EXTENSION === port.name) {
      openCount -= 1;

      if (openCount <= 0) {
        waitingToStop = true;
        idleTimer = setTimeout(() => {
          koniState.sleep().then(() => {
            waitingToStop = false;

            console.log('Shut down due to popup getting closed---------------------------------');
          }).catch((err) => console.warn(err));
        }, IDLE_TIME);
      }
    }

    console.warn(`Disconnected from ${port.name}`);
  });
});

// Trigger single mode
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    onExtensionInstall();
  }

  handleExtensionIdling();
});

chrome.runtime.onStartup.addListener(function () {
  handleExtensionIdling();
});

// initial setup
cryptoWaitReady()
  .then((): void => {
    console.log('crypto initialized');

    // load all the keyring data
    keyring.loadAll({ store: new AccountsStore(), type: 'sr25519' });

    console.log('initialization completed');
  })
  .catch((error): void => {
    console.error('initialization failed', error);
  });
