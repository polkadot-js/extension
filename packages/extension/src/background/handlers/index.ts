// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageRequest } from '../types';

import { PORT_POPUP } from '../../defaults';
import Extension from './Extension';
import State from './State';
import Tabs from './Tabs';

const FALLBACK_URL = '<unknown>';

const state = new State();
const extension = new Extension(state);
const tabs = new Tabs(state);

function createSubscription (id: number, port: chrome.runtime.Port): (data: any) => void {
  // FIXME We are not handling actual unsubscribes yet, this is an issue
  return (subscription: any) => {
    port.postMessage({ id, subscription });
  };
}

export default function handler ({ id, message, request }: MessageRequest, port: chrome.runtime.Port): void {
  const isPopup = port.name === PORT_POPUP;
  const sender = port.sender as chrome.runtime.MessageSender;
  const from = isPopup
    ? 'popup'
    : (sender.tab && sender.tab.url) || sender.url;
  const source = `${from || FALLBACK_URL}: ${id}: ${message}`;

  console.log(` [in] ${source}`); // :: ${JSON.stringify(request)}`);

  // This is not great - basically, based on the name (since there is only 1 atm),
  // we create a subscription handler. Basically these handlers will continute stream
  // results as they become available
  const subscription = message.indexOf('.subscribe') !== -1
    ? createSubscription(id, port)
    : undefined;
  const promise = isPopup
    ? extension.handle(message, request)
    : tabs.handle(message, request, from || FALLBACK_URL, subscription);

  promise
    .then((response) => {
      console.log(`[out] ${source}`); // :: ${JSON.stringify(response)}`);

      if (subscription) {
        // TODO See unsub handling above, here we need to store the
        // actual unsubscribe and handle appropriately
        port.postMessage({ id, response: true });
      } else {
        port.postMessage({ id, response });
      }
    })
    .catch((error) => {
      console.log(`[err] ${source}:: ${error.message}`);

      port.postMessage({ id, error: error.message });
    });
}
