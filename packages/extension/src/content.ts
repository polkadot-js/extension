// Copyright 2019-2024 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Message } from '@polkadot/extension-base/types';

import { MESSAGE_ORIGIN_CONTENT, MESSAGE_ORIGIN_PAGE, PORT_CONTENT } from '@polkadot/extension-base/defaults';
import { ensurePortConnection } from '@polkadot/extension-base/utils/portUtils';
import { chrome } from '@polkadot/extension-inject/chrome';
import { replaceLinksInTextNodes2 } from './detectlinks';
import { debouncedReplaceLinks } from './background';

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

  console.log(`[c]trying to replace links`);
  debouncedReplaceLinks(); // Use the debounced function


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

/*
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", replaceLinksInTextNodes(document.body));
} else {
*/
debouncedReplaceLinks(); // Use the debounced function

//replaceLinksInTextNodes2(document.body);
//}
// Set up a MutationObserver to handle dynamically loaded content
/*
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    // Process each mutation
    if (mutation.addedNodes.length > 0) {
      debouncedReplaceLinks(); // Ensure this processes new content
    }
  });
});

*/
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
   replaceLinksInTextNodes2(node);
   //   debouncedReplaceLinks(); //  replaceLinksInTextNodes2(node);
    });
  });
});

// Observe changes in the entire document body
observer.observe(document.body, { childList: true, subtree: true });

(document.head || document.documentElement).appendChild(script);
