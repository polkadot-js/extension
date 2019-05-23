// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageRequest } from '../types';

import Extension from './Extension';
import State from './State';
import Tabs from './Tabs';

const state = new State();
const extension = new Extension(state);
const tabs = new Tabs(state);

export default function handler ({ id, message, request }: MessageRequest, { tab }: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): boolean {
  const source = `${tab ? tab.url : 'extension'}: ${id}: ${message}`;

  console.log(` [in] ${source}`); // :: ${JSON.stringify(request)}`);

  const promise = tab
    ? tabs.handle(message, request, tab.url)
    : extension.handle(message, request);

  promise
    .then((response) => {
      console.log(`[out] ${source}`); // :: ${JSON.stringify(response)}`);

      sendResponse({ id, response });
    })
    .catch((error) => {
      console.log(`[err] ${source}:: ${error.message}`);

      sendResponse({ id, error: error.message });
    });

  // return true to indicate we are sending the respionse async
  return true;
}
