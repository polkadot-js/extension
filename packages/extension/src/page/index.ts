// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { InjectedWindow } from '@polkadot/extension-dapp/types';
import { MessageTypes } from '../background/types';

import Injected from './Injected';

// when sending a message from the injector to the expension, we
//  - create an event - this we send to the loader
//  - the loader takes this evend and uses sendMessage to the extension background
//  - on respoinse, the loader creates a reponse event
//  - this injector, reads listends on the events, maps it to the original
//  - resolves/rejects the promise with the result

type Handlers = {
  [index: number]: {
    resolve: (data: any) => void,
    reject: (error: Error) => void
  }
};

// small helper with the typescript types, just cast window
const windowInject = window as InjectedWindow;
const handlers: Handlers = {};
let idCounter = 0;

// a generic message sender that creates an event, returning a promise that will
// resolve once the event is resolved (by the response listener just below this)
function sendMessage (message: MessageTypes, request: any = null): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = ++idCounter;

    handlers[id] = { resolve, reject };

    window.postMessage({ id, message, origin: 'page', request }, '*');
  });
}

// the enable function, called by the dapp to allow access
async function enable (origin: string): Promise<Injected> {
  await sendMessage('authorize.tab', { origin });

  return new Injected(sendMessage);
}

// setup a response listener (events created by the loader for extension responses)
window.addEventListener('message', ({ data, source }) => {
  // only allow messages from our window, by the loader
  if (source !== window || data.origin !== 'content') {
    return;
  }

  const handler = handlers[data.id];

  if (!handler) {
    console.error(`Uknown response: ${JSON.stringify(data)}`);
    return;
  }

  delete handlers[data.id];

  if (data.error) {
    handler.reject(new Error(data.error));
  } else {
    handler.resolve(data.response);
  }
});

// don't clobber the existing object, we will add it it (or create as needed)
windowInject.injectedWeb3 = windowInject.injectedWeb3 || {};

// add our enable function
windowInject.injectedWeb3['polkadot-js'] = {
  enable,
  version: process.env.PKG_VERSION as string
};
