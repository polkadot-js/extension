// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MessageTypes, MessageTypesWithNoSubscriptions, MessageTypesWithNullRequest, MessageTypesWithSubscriptions, RequestTypes, ResponseTypes, SubscriptionMessageTypes } from '@subwallet/extension-base/background/types';
import { Message } from '@subwallet/extension-base/types';
import { getId } from '@subwallet/extension-base/utils/getId';

import { VirtualMessageCenter } from './VirtualMessageCenter';

interface Handler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscriber?: (data: any) => void;
}

type Handlers = Record<string, Handler>;

// const port = chrome.runtime.connect({ name: PORT_EXTENSION });
const port = VirtualMessageCenter.getInstance().ui;
const handlers: Handlers = {};

// Set the port as ready
port.setReady();

// setup a listener for messages, any incoming resolves the promise
// port.onMessage.addListener((response: Record<string, any>): void => {
//   console.log('=====response', response);
//   const data = response.data;
//   const handler = handlers[data.id];

//   if (!handler) {
//     console.error(`Unknown response: ${JSON.stringify(data)}`);

//     return;
//   }

//   if (!handler.subscriber) {
//     delete handlers[data.id];
//   }

//   if (data.subscription) {
//     // eslint-disable-next-line @typescript-eslint/ban-types
//     (handler.subscriber as Function)(data.subscription);
//   } else if (data.error) {
//     handler.reject(new Error(data.error));
//   } else {
//     handler.resolve(data.response);
//   }
// });

port.addEventListener('message', (event) => {
  const data = event.data as Message['data'];
  const handler = handlers[data.id];

  if (!handler) {
    // console.error(`Unknown response: ${JSON.stringify(data)}`)

    return;
  }

  // delete handlers if handler don't include subscriber with event from BACKGROUND
  // @ts-ignore
  if (!handler.subscriber && data.sender === 'BACKGROUND') {
    delete handlers[data.id];
  }

  if (data.subscription) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    (handler.subscriber as Function)(data.subscription);
  } else {
    // @ts-ignore
    if (data.sender === 'BACKGROUND') {
      // if (!handler.subscriber) {
      //   delete handlers[data.id]
      // }

      // if (data.subscription) {
      //   // eslint-disable-next-line @typescript-eslint/ban-types
      //   ;(handler.subscriber as Function)(data.subscription)
      // }
      // else
      if (data.error) {
        handler.reject(new Error(data.error));
      } else {
        handler.resolve(data.response);
      }
    }
  }
});

export function sendMessage<TMessageType extends MessageTypesWithNullRequest> (message: TMessageType): Promise<ResponseTypes[TMessageType]>;
export function sendMessage<TMessageType extends MessageTypesWithNoSubscriptions> (message: TMessageType, request: RequestTypes[TMessageType]): Promise<ResponseTypes[TMessageType]>;
export function sendMessage<TMessageType extends MessageTypesWithSubscriptions> (message: TMessageType, request: RequestTypes[TMessageType], subscriber: (data: SubscriptionMessageTypes[TMessageType]) => void): Promise<ResponseTypes[TMessageType]>;

export function sendMessage<TMessageType extends MessageTypes> (message: TMessageType, request?: RequestTypes[TMessageType], subscriber?: (data: unknown) => void): Promise<ResponseTypes[TMessageType]> {
  return new Promise((resolve, reject): void => {
    const id = getId();

    handlers[id] = { reject, resolve, subscriber };

    port.postMessage({ id, message, request: request || {} });
  });
}

export function lazySendMessage<TMessageType extends MessageTypesWithNoSubscriptions> (message: TMessageType, request: RequestTypes[TMessageType], callback: (data: ResponseTypes[TMessageType]) => void): {promise: Promise<ResponseTypes[TMessageType]>, start: () => void} {
  const id = getId();
  const handlePromise = new Promise((resolve, reject): void => {
    handlers[id] = { reject, resolve };
  });

  const rs = {
    promise: handlePromise as Promise<ResponseTypes[TMessageType]>,
    start: () => {
      port.postMessage({ id, message, request: request || {} });
    }
  };

  rs.promise.then((data) => {
    callback(data);
  }).catch(console.error);

  return rs;
}

export function lazySubscribeMessage<TMessageType extends MessageTypesWithSubscriptions> (message: TMessageType, request: RequestTypes[TMessageType], callback: (data: ResponseTypes[TMessageType]) => void, subscriber: (data: SubscriptionMessageTypes[TMessageType]) => void): {promise: Promise<ResponseTypes[TMessageType]>, start: () => void, unsub: () => void} {
  const id = getId();
  let cancel = false;
  const handlePromise = new Promise((resolve, reject): void => {
    handlers[id] = { reject, resolve, subscriber };
  });

  const rs = {
    promise: handlePromise as Promise<ResponseTypes[TMessageType]>,
    start: () => {
      port.postMessage({ id, message, request: request || {} });
    },
    unsub: () => {
      const handler = handlers[id];

      cancel = true;

      if (handler) {
        delete handler.subscriber;
        handler.resolve(null);
      }
    }
  };

  rs.promise.then((data) => {
    !cancel && callback(data);
  }).catch(console.error);

  return rs;
}

export function subscribeMessage<TMessageType extends MessageTypesWithSubscriptions> (message: TMessageType, request: RequestTypes[TMessageType], callback: (data: ResponseTypes[TMessageType]) => void, subscriber: (data: SubscriptionMessageTypes[TMessageType]) => void): {promise: Promise<ResponseTypes[TMessageType]>, unsub: () => void} {
  const lazyItem = lazySubscribeMessage(message, request, callback, subscriber);

  lazyItem.start();

  return {
    promise: lazyItem.promise,
    unsub: lazyItem.unsub
  };
}
