// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { TransportRequestMessage, MessageTypes } from '../types';

import { PORT_POPUP } from '../../defaults';
import Extension from './Extension';
import State from './State';
import Tabs from './Tabs';

const state = new State();
const extension = new Extension(state);
const tabs = new Tabs(state);

export default function handler<TMessageType extends MessageTypes> ({ id, message, request }: TransportRequestMessage<TMessageType>, port: chrome.runtime.Port): void {
  const isPopup = port.name === PORT_POPUP;
  const sender = port.sender as chrome.runtime.MessageSender;
  const from = isPopup
    ? 'popup'
    : (sender.tab && sender.tab.url) || sender.url || '<unknown>';
  const source = `${from}: ${id}: ${message}`;

  console.log(` [in] ${source}`); // :: ${JSON.stringify(request)}`);

  const promise = isPopup
    ? extension.handle(id, message, request, port)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : tabs.handle(id, message, request, from, port, (message: any): void => { port.postMessage(message); });

  promise
    .then((response): void => {
      console.log(`[out] ${source}`); // :: ${JSON.stringify(response)}`);

      port.postMessage({ id, response });
    })
    .catch((error): void => {
      console.log(`[err] ${source}:: ${error.message}`);

      port.postMessage({ id, error: error.message });
    });
}
