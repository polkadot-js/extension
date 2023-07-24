// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MessageTypes, TransportRequestMessage } from '../types';

import { PORT_EXTENSION } from '../../defaults';
import Extension from './Extension';
import State from './State';
import Tabs from './Tabs';

const state = new State();
const extension = new Extension(state);
const tabs = new Tabs(state);

export default function handler<TMessageType extends MessageTypes> (
  { id: messageId, message, request }: TransportRequestMessage<TMessageType>,
  getCurrentPort: () => chrome.runtime.Port,
  getContentPort: (tabId: number) => chrome.runtime.Port
): void {
  const isExtension = getCurrentPort().name === PORT_EXTENSION;

  const sender = getCurrentPort().sender as chrome.runtime.MessageSender;

  const from = isExtension
    ? 'extension'
    : (sender.tab && sender.tab.url) || sender.url || '<unknown>';
  const source = `${from}: ${messageId}: ${message}`;

  console.log(` [in] ${source}`); // :: ${JSON.stringify(request)}`);

  const respond = (response: unknown) => {
    getCurrentPort().postMessage({ id: messageId, response });
  };

  const promise = isExtension
    ? extension.handle(messageId, message, request, respond, getCurrentPort, getContentPort)
    : tabs.handle(messageId, message, request, respond, from, getCurrentPort);

  promise
    .catch((error: Error): void => {
      console.log(`[err] ${source}:: ${error.message}`);

      getCurrentPort().postMessage({ error: error.message, id: messageId });
    });
}
