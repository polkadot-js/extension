// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import extension from 'extensionizer';

import events, { eventTarget } from './events';

function sendResponse (detail: any): void {
  // create the custom event, this will be handled on the injection script
  eventTarget.dispatchEvent(new CustomEvent(events.response, { detail }));
}

// Handle all custom events, passing messages to the extension
eventTarget.addEventListener(events.request, (event) => {
  // get the request as part of the the event detailt
  const request = (event as CustomEvent).detail;

  // pass the detail as-is as a message to the extension
  extension.runtime.sendMessage(request, (response) => {
    if (!response) {
      // no data, send diconnected/unknown error
      sendResponse({ id: request.id, error: 'Unknown response' });
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
