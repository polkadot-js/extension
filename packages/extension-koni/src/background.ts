// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Runs in the extension background, handling all keyring access

import '@polkadot/extension-inject/crossenv';

import type { RequestSignatures, TransportRequestMessage } from '@polkadot/extension-base/background/types';

import { withErrorLog } from '@polkadot/extension-base/background/handlers/helpers';
import { PORT_CONTENT, PORT_EXTENSION } from '@polkadot/extension-base/defaults';
import { AccountsStore } from '@polkadot/extension-base/stores';
import handlers from '@polkadot/extension-koni-base/background/handlers';
import { KoniCron } from '@polkadot/extension-koni-base/cron';
import keyring from '@polkadot/ui-keyring';
import { assert } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';

// setup the notification (same a FF default background, white text)
withErrorLog(() => chrome.browserAction.setBadgeBackgroundColor({ color: '#d90000' }));

// listen to all messages and handle appropriately
chrome.runtime.onConnect.addListener((port): void => {
  // shouldn't happen, however... only listen to what we know about
  assert([PORT_CONTENT, PORT_EXTENSION].includes(port.name), `Unknown connection from ${port.name}`);

  // message and disconnect handlers
  port.onMessage.addListener((data: TransportRequestMessage<keyof RequestSignatures>) => handlers(data, port));
  port.onDisconnect.addListener(() => console.log(`Disconnected from ${port.name}`));
});

// initial setup
cryptoWaitReady()
  .then((): void => {
    console.log('crypto initialized');

    // load all the keyring data
    keyring.loadAll({ store: new AccountsStore(), type: 'sr25519' });

    // Init cron
    (new KoniCron()).init();

    console.log('initialization completed');
  })
  .catch((error): void => {
    console.error('initialization failed', error);
  });
