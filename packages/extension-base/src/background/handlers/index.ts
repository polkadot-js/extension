// Copyright 2019-2025 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* global chrome */

import type { MessageTypes, TransportRequestMessage } from '../types.js';

import { assert } from '@polkadot/util';

import { PORT_EXTENSION } from '../../defaults.js';
import Extension from './Extension.js';
import State from './State.js';
import Tabs from './Tabs.js';

export { withErrorLog } from './helpers.js';

const state = new State();

await state.init();
const extension = new Extension(state);
const tabs = new Tabs(state);

export default function handler<TMessageType extends MessageTypes> ({ id, message, request }: TransportRequestMessage<TMessageType>, port?: chrome.runtime.Port, extensionPortName = PORT_EXTENSION): void {
  const isExtension = !port || port?.name === extensionPortName;
  const sender = port?.sender;

  if (!isExtension && !sender) {
    throw new Error('Unable to extract message sender');
  }

  const from = isExtension
    ? 'extension'
    : sender?.url || sender?.tab?.url || '<unknown>';

  const source = `${from}: ${id}: ${message}`;

  console.log(` [in] ${source}`); // :: ${JSON.stringify(request)}`);

  const promise = isExtension
    ? extension.handle(id, message, request, port)
    : tabs.handle(id, message, request, from, port);

  promise
    .then((response: unknown): void => {
      console.log(`[out] ${source}`); // :: ${JSON.stringify(response)}`);

      // between the start and the end of the promise, the user may have closed
      // the tab, in which case port will be undefined
      assert(port, 'Port has been disconnected');

      port.postMessage({ id, response });
    })
    .catch((error: Error): void => {
      console.log(`[err] ${source}:: ${error.message}`);

      // only send message back to port if it's still connected
      if (port) {
        port.postMessage({ error: error.message, id });
      }
    });
}
