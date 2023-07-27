// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Runs in the extension background, handling all keyring access

import '@polkadot/extension-inject/crossenv';

import type { RequestSignatures, TransportRequestMessage } from '@polkadot/extension-base/background/types';

import handlers, { init as initHandlers } from '@polkadot/extension-base/background/handlers';
import { withErrorLog } from '@polkadot/extension-base/background/handlers/helpers';
import { PORT_EXTENSION } from '@polkadot/extension-base/defaults';
import { AccountsStore } from '@polkadot/extension-base/stores';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import preloadedChainsMetadata from './chains-metadata.json';
import listenOnPort from './listenOnPort';

// setup the notification (same a FF default background, white text)
withErrorLog(() => chrome.action.setBadgeBackgroundColor({ color: '#d90000' }));

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    initHandlers({
      // This type assertion is fine as the metadata is runtime-validated before being saved
      chainMetadataSets: preloadedChainsMetadata as Parameters<typeof initHandlers>[0]['chainMetadataSets']
    }).catch((e) => console.error('Error initializing handlers:', e));
  }
});

listenOnPort((getContentPort, getCurrentPort) => {
  /**
   * Trigger reconnection every < 5 minutes to maintain the communication with
   * the volatile service worker.
   * The "connecting ends" are adjusted to reconnect upon disconnection.
   */
  const timer = setTimeout(() => {
    console.info('Performing a planned port reconnection.');
    getCurrentPort().disconnect();
  }, 250e3);

  // message and disconnect handlers
  getCurrentPort().onMessage.addListener((data: TransportRequestMessage<keyof RequestSignatures>) => handlers(data, getCurrentPort, getContentPort));
  getCurrentPort().onDisconnect.addListener((port) => {
    clearTimeout(timer);

    console.log(`Disconnected from ${port.name}`);
  });
});

function getActiveTabs () {
  // queriing the current active tab in the current window should only ever return 1 tab
  // although an array is specified here
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // get the urls of the active tabs. In the case of new tab the url may be empty or undefined
    // we filter these out
    const url = tabs
      .map(({ url }) => url)
      .filter((url) => !!url)[0];

    const request: TransportRequestMessage<'pri(activeTabUrl.update)'> = {
      id: 'background',
      message: 'pri(activeTabUrl.update)',
      origin: 'background',
      request: { url }
    };

    const portGetterMock = () => ({
      name: PORT_EXTENSION,
      postMessage: (param: any) => undefined, // eslint-disable-line
    } as chrome.runtime.Port);

    // This invocation is only pretending to be handling a port connection message, so we're sending
    // a mock port getter as there are no ports involved.
    handlers(request, portGetterMock, portGetterMock);
  });
}

// listen to tab updates this is fired on url change
chrome.tabs.onUpdated.addListener((_, changeInfo) => {
  // we are only interested in url change
  if (!changeInfo.url) {
    return;
  }

  getActiveTabs();
});

// the list of active tab changes when switching window
// in a mutli window setup
chrome.windows.onFocusChanged.addListener(() =>
  getActiveTabs()
);

// when clicking on an existing tab or opening a new tab this will be fired
// before the url is entered by users
chrome.tabs.onActivated.addListener(() => {
  getActiveTabs();
});

// when deleting a tab this will be fired
chrome.tabs.onRemoved.addListener(() => {
  getActiveTabs();
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
