// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MessageTypes, TransportRequestMessage } from '@subwallet/extension-base/background/types';
import { PORT_EXTENSION } from '@subwallet/extension-base/defaults';
import { NftHandler } from '@subwallet/extension-koni-base/api/nft';
import KoniExtension from '@subwallet/extension-koni-base/background/handlers/Extension';
import KoniState from '@subwallet/extension-koni-base/background/handlers/State';
import KoniTabs from '@subwallet/extension-koni-base/background/handlers/Tabs';

import { assert } from '@polkadot/util';

export const state = new KoniState();

state.initNetworkStates();

export const extension = new KoniExtension(state);
export const tabs = new KoniTabs(state);
export const nftHandler = new NftHandler(state.getDotSamaApiMap(), [], state.getWeb3ApiMap());

state.updateServiceInfo();

export default function handlers<TMessageType extends MessageTypes> ({ id, message, request }: TransportRequestMessage<TMessageType>, port: chrome.runtime.Port, extensionPortName = PORT_EXTENSION): void {
  const isExtension = port.name === extensionPortName;
  const sender = port.sender as chrome.runtime.MessageSender;
  const from = isExtension
    ? 'extension'
    : (sender.tab && sender.tab.url) || sender.url || '<unknown>';
  const source = `${from}: ${id}: ${message}`;

  console.log(` [in] ${source}`); // :: ${JSON.stringify(request)}`);

  const promise = isExtension
    ? extension.handle(id, message, request, port)
    : tabs.handle(id, message, request, from, port);

  promise
    .then((response): void => {
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
