// Copyright 2019-2024 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Message } from '@polkadot/extension-base/types';

import { MESSAGE_ORIGIN_CONTENT, MESSAGE_ORIGIN_PAGE, PORT_CONTENT } from '@polkadot/extension-base/defaults';
import { ensurePortConnection } from '@polkadot/extension-base/utils/portUtils';
import { chrome } from '@polkadot/extension-inject/chrome';

let port: chrome.runtime.Port | undefined;

function onPortMessageHandler (data: Message['data']): void {
  window.postMessage({ ...data, origin: MESSAGE_ORIGIN_CONTENT }, '*');
}

function onPortDisconnectHandler (): void {
  port = undefined;
}

const portConfig = {
  onPortDisconnectHandler,
  onPortMessageHandler,
  portName: PORT_CONTENT
};

// all messages from the page, pass them to the extension
window.addEventListener('message', ({ data, source }: Message): void => {
  // only allow messages from our window, by the inject
  if (source !== window || data.origin !== MESSAGE_ORIGIN_PAGE) {
    return;
  }

  // in the event of a service worker crash, the port's name will be
  // renamed to something bogus. so we need to unset the port variable.
  if (port && port.name !== PORT_CONTENT) {
    port = undefined;
  }

  ensurePortConnection(port, portConfig).then((connectedPort) => {
    connectedPort.postMessage(data);
    port = connectedPort;
  }).catch((error) => console.error(`Failed to send message: ${(error as Error).message}`));
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
