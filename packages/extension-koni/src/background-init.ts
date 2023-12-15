// Copyright 2019-2022 @subwallet/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { withErrorLog } from '@subwallet/extension-base/background/handlers/helpers';

// Todo: MV3 fix this detect fetch events and await for special event

withErrorLog(() => chrome.action.setBadgeBackgroundColor({ color: '#d90000' }));

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    // Add small timeout to avoid unwanted problems with the extension popup in the first time loaded
    setTimeout(() => {
      try {
        // Open expand page
        const url = `${chrome.runtime.getURL('index.html')}#/`;

        withErrorLog(() => chrome.tabs.create({ url }));
      } catch (e) {
        console.error(e);
      }
    }, 900);
  }
});
