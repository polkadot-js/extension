// Copyright 2019-2022 @subwallet/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { withErrorLog } from '@subwallet/extension-base/background/handlers/helpers';
import { ActionHandler } from '@subwallet/extension-koni/helper/ActionHandler';

import { xglobal } from '@polkadot/x-global';

const actionHandler = ActionHandler.instance;

xglobal.addEventListener('fetch', function (event: FetchEvent) {
  if (event.request.url.endsWith('popup.html')) {
    console.log('Open popup tab');
    event.respondWith(new Response('OKs'));
  }
});

withErrorLog(() => chrome.action.setBadgeBackgroundColor({ color: '#d90000' }));

chrome.runtime.onConnect.addListener((port): void => {
  actionHandler.handlePort(port);
});

// Open expand page after install
chrome.runtime.onInstalled.addListener(function (details) {
  actionHandler.onInstalled(details);
});

// Setup uninstall URL every background start
chrome.runtime.setUninstallURL('https://slink.subwallet.app/uninstall-feedback');
