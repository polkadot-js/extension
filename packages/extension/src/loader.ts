// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import extension from 'extensionizer';

function sendResponse (data: any): void {
  window.postMessage({ ...data, origin: 'loader' }, '*');
}

// Handle all messages, passing messages to the extension
window.addEventListener('message', ({ data, source }) => {
  // only allow messages from our window, by the inject
  if (source !== window || data.origin !== 'inject') {
    return;
  }

  // pass the detail as-is as a message to the extension
  extension.runtime.sendMessage(data, (response) => {
    if (!response) {
      // no data, send diconnected/unknown error
      sendResponse({ id: data.id, error: 'Unknown response' });
    } else {
      // handle the response, passing as a custom event
      sendResponse(response);
    }
  });
});

// inject our data injector
const script = document.createElement('script');

script.src = extension.extension.getURL('inject.js');
script.onload = (): void => {
  // remove the injecting tag when loaded
  if (script.parentNode) {
    script.parentNode.removeChild(script);
  }
};

(document.head || document.documentElement).appendChild(script);
