// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SubscriptionMessageTypes, MessageTypesWithSubscriptions } from '../types';

type Subscriptions = Record<string, chrome.runtime.Port>;

const subscriptions: Subscriptions = {};

// return a subscription callback, that will send the data to the caller via the port
export function createSubscription<TMessageType extends MessageTypesWithSubscriptions> (id: string, port: chrome.runtime.Port): (data: SubscriptionMessageTypes[TMessageType]) => void {
  subscriptions[id] = port;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (subscription: any): void => {
    if (subscriptions[id]) {
      port.postMessage({ id, subscription });
    }
  };
}

// clear a previous subscriber
export function unsubscribe (id: string): void {
  if (subscriptions[id]) {
    console.log(`Unsubscribing from ${id}`);

    delete subscriptions[id];
  } else {
    console.error(`Unable to unsubscribe from ${id}`);
  }
}
