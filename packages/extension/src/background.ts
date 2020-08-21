// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

// Runs in the extension background, handling all keyring access

import handlers from '@polkadot/extension-base/background/handlers';
import { PORT_CONTENT, PORT_EXTENSION } from '@polkadot/extension-base/defaults';
import { AccountsStore } from '@polkadot/extension-base/stores';
import chrome from '@polkadot/extension-inject/chrome';
import keyring from '@polkadot/ui-keyring';
import { assert } from '@polkadot/util';

import { cryptoWaitReady } from '@polkadot/util-crypto';
import meshAccountsEnhancer from './meshAccountsEnhancer';
// setup the notification (same a FF default background, white text)
chrome.browserAction.setBadgeBackgroundColor({ color: '#d90000' });

// listen to all messages and handle appropriately
chrome.runtime.onConnect.addListener((port): void => {
  // shouldn't happen, however... only listen to what we know about
  assert([PORT_CONTENT, PORT_EXTENSION].includes(port.name), `Unknown connection from ${port.name}`);

  // message and disconnect handlers
  port.onMessage.addListener((data): void => handlers(data, port));
  port.onDisconnect.addListener((): void => console.log(`Disconnected from ${port.name}`));
});

// initial setup
cryptoWaitReady()
  .then((): void => {
    console.log('crypto initialized');

    // load all the keyring data
    keyring.loadAll({ store: new AccountsStore(), type: 'sr25519' });

    meshAccountsEnhancer();

    console.log('initialization completed');
  })
  .catch((error): void => {
    console.error('initialization failed', error);
  });
