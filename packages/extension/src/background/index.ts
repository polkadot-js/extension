// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import extension from 'extensionizer';

// Runs in the extension background, handling all keyring access

import keyring from '@polkadot/ui-keyring';
import { assert } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { PORT_CONTENT, PORT_POPUP } from '../defaults';
import ChromeStore from './ChromeStore';
import handlers from './handlers';

// setup the notification (same a FF default background, white text)
extension.browserAction.setBadgeBackgroundColor({ color: '#d90000' });

// listen to all messages and handle appropriately
extension.runtime.onConnect.addListener((port) => {
  // shouldn't happen, however... only listen to what we know about
  assert([PORT_CONTENT, PORT_POPUP].includes(port.name), `Unknown connection from ${port.name}`);

  // message and disconnect handlers
  port.onMessage.addListener((data) => handlers(data, port));
  port.onDisconnect.addListener(() => console.log(`Disconnected from ${port.name}`));
});

// initial setup
cryptoWaitReady()
  .then(() => {
    console.log('crypto initialized');

    // load all the keyring data
    keyring.loadAll({ store: new ChromeStore(), type: 'sr25519' });

    console.log('initialization completed');
  })
  .catch((error) => {
    console.error('initialization failed', error);
  });
