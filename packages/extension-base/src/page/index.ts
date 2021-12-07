// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MessageTypes, MessageTypesWithNoSubscriptions, MessageTypesWithNullRequest, MessageTypesWithSubscriptions, RequestTypes, ResponseTypes, SubscriptionMessageTypes, TransportRequestMessage, TransportResponseMessage } from '../background/types';

import { MESSAGE_ORIGIN_PAGE } from '../defaults';
import { getId } from '../utils/getId';
import Injected from './Injected';

// when sending a message from the injector to the extension, we
//  - create an event - this we send to the loader
//  - the loader takes this event and uses port.postMessage to background
//  - on response, the loader creates a reponse event
//  - this injector, listens on the events, maps it to the original
//  - resolves/rejects the promise with the result (or sub data)

export interface Handler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (data?: any) => void;
  reject: (error: Error) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscriber?: (data: any) => void;
}

export type Handlers = Record<string, Handler>;

const handlers: Handlers = {};

// a generic message sender that creates an event, returning a promise that will
// resolve once the event is resolved (by the response listener just below this)
export function sendMessage<TMessageType extends MessageTypesWithNullRequest>(message: TMessageType): Promise<ResponseTypes[TMessageType]>;
export function sendMessage<TMessageType extends MessageTypesWithNoSubscriptions>(message: TMessageType, request: RequestTypes[TMessageType]): Promise<ResponseTypes[TMessageType]>;
export function sendMessage<TMessageType extends MessageTypesWithSubscriptions>(message: TMessageType, request: RequestTypes[TMessageType], subscriber: (data: SubscriptionMessageTypes[TMessageType]) => void): Promise<ResponseTypes[TMessageType]>;

export function sendMessage<TMessageType extends MessageTypes> (message: TMessageType, request?: RequestTypes[TMessageType], subscriber?: (data: unknown) => void): Promise<ResponseTypes[TMessageType]> {
  return new Promise((resolve, reject): void => {
    const id = getId();

    handlers[id] = { reject, resolve, subscriber };

    const transportRequestMessage: TransportRequestMessage<TMessageType> = {
      id,
      message,
      origin: MESSAGE_ORIGIN_PAGE,
      request: request || null as RequestTypes[TMessageType]
    };

    window.postMessage(transportRequestMessage, '*');
  });
}

// the enable function, called by the dapp to allow access
export async function enable (origin: string): Promise<Injected> {
  await sendMessage('pub(authorize.tab)', { origin });

  return new Injected(sendMessage);
}

// redirect users if this page is considered as phishing, otherwise return false
export async function redirectIfPhishing (): Promise<boolean> {
  const res = await sendMessage('pub(phishing.redirectIfDenied)');

  return res;
}

export function handleResponse<TMessageType extends MessageTypes> (data: TransportResponseMessage<TMessageType> & { subscription?: string }): void {
  const handler = handlers[data.id];

  if (!handler) {
    console.error(`Unknown response: ${JSON.stringify(data)}`);

    return;
  }

  if (!handler.subscriber) {
    delete handlers[data.id];
  }

  if (data.subscription) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    (handler.subscriber as Function)(data.subscription);
  } else if (data.error) {
    handler.reject(new Error(data.error));
  } else {
    handler.resolve(data.response);
  }
}
