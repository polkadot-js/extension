// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import extension from 'extensionizer';

// Runs in the extension background, handling all keyring access

import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { PORT_CONTENT, PORT_POPUP } from '../defaults';
import ChromeStore from './ChromeStore';
import handlers from './handlers';

// setup the notification
extension.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });

// listen to all messages and handle appropriately
extension.runtime.onConnect.addListener((port) => {
  const { name } = port;

  if ([PORT_CONTENT, PORT_POPUP].includes(name)) {
    port.onMessage.addListener((data) =>
      handlers(data, port)
    );
    port.onDisconnect.addListener(() =>
      console.log(`Disconnected from ${name}`)
    );
  }
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
