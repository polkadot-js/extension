// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Message } from '@polkadot/extension-base/types';

import { MESSAGE_ORIGIN_CONTENT, MESSAGE_ORIGIN_PAGE, PORT_CONTENT } from '@polkadot/extension-base/defaults';
import { chrome } from '@polkadot/extension-inject/chrome';

let port: chrome.runtime.Port;

// connect to the extension
const connect = (): chrome.runtime.Port => {
  port = chrome.runtime.connect({ name: PORT_CONTENT });
  port.onDisconnect.addListener(connect);

  // send any messages from the extension back to the page
  port.onMessage.addListener((data): void => {
    window.postMessage({ ...data, origin: MESSAGE_ORIGIN_CONTENT }, '*');
  });

  return port;
};

port = connect();

// all messages from the page, pass them to the extension
window.addEventListener('message', ({ data, source }: Message): void => {
  // only allow messages from our window, by the inject
  if (source !== window || data.origin !== MESSAGE_ORIGIN_PAGE) {
    return;
  }

  port.postMessage(data);
});

// inject our data injector
const script = document.createElement('script');

script.src = chrome.runtime.getURL('page.js');

script.onload = (): void => {
  // remove the injecting tag when loaded
  if (script.parentNode) {
    script.parentNode.removeChild(script);
  }
};

(document.head || document.documentElement).appendChild(script);
