// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

const EXTERNAL_POPUP_PATH = 'notification.html';

export default (path: string) => {
  window.close();

  return chrome.windows.create({
    focused: true,
    height: 625,
    state: 'normal',
    type: 'popup',
    url: chrome.extension.getURL(`${EXTERNAL_POPUP_PATH}#/${path}`),
    width: 360
  }, (window) => {
    if (window) {
      /*
        There is a bug in Chrome that causes the extension popup to go fullscreen when the user has any
        fullscreen browser window opened on the main screen, so we have to update the size.
       */
      chrome.windows.update(window.id || 0, { state: 'normal' }).catch(console.error);
    }
  });
};
