// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { WindowInjected } from './types';

import events, { eventTarget } from '../events';
import Injected from './Injected';

const callbacks: { [index: number]: { resolve: (data: any) => void, reject: (error: Error) => void } } = {};
let idCounter = 0;

// setup a response listener (events created by the loader for extension responses)
eventTarget.addEventListener(events.response, (event) => {
  const response = (event as CustomEvent).detail;
  const promise = callbacks[response.id];

  if (!promise) {
    console.error(`Uknown response: ${JSON.stringify(response)}`);
    return;
  }

  delete callbacks[response.id];

  if (response.error) {
    promise.reject(new Error(response.error));
  } else {
    promise.resolve(response.response);
  }
});

// small helper with the typescript types, just cast window
const windowInject = window as WindowInjected;

// attach the injectedWeb3 object
windowInject.injectedWeb3 = windowInject.injectedWeb3 || {};
windowInject.injectedWeb3['polkadot-js'] = new Injected(
  (message: string, request: any = null): Promise<any> => {
    return new Promise((resolve, reject) => {
      const id = ++idCounter;

      callbacks[id] = { resolve, reject };

      eventTarget.dispatchEvent(
        new CustomEvent(events.request, { detail: { id, message, request } })
      );
    });
  }
);
