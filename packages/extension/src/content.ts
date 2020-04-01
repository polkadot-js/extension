// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import extension from 'extensionizer';
import { PORT_CONTENT } from '@polkadot/extension-base/defaults';

// connect to the extension
const port = extension.runtime.connect({ name: PORT_CONTENT });

// send any messages from the extension back to the page
port.onMessage.addListener((data): void => {
  window.postMessage({ ...data, origin: 'content' }, '*');
});

// all messages from the page, pass them to the extension
window.addEventListener('message', ({ data, source }): void => {
  // only allow messages from our window, by the inject
  if (source !== window || data.origin !== 'page') {
    return;
  }

  port.postMessage(data);
});

// inject our data injector
const script = document.createElement('script');

script.src = extension.extension.getURL('page.js');

script.onload = (): void => {
  // remove the injecting tag when loaded
  if (script.parentNode) {
    script.parentNode.removeChild(script);
  }
};

(document.head || document.documentElement).appendChild(script);
