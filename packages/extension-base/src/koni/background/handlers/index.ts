// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ProviderError } from '@subwallet/extension-base/background/errors/ProviderError';
import { MessageTypes, TransportRequestMessage } from '@subwallet/extension-base/background/types';
import { PORT_EXTENSION, PORT_MOBILE } from '@subwallet/extension-base/defaults';
import { NftHandler } from '@subwallet/extension-base/koni/api/nft';
import KoniExtension from '@subwallet/extension-base/koni/background/handlers/Extension';
import Mobile from '@subwallet/extension-base/koni/background/handlers/Mobile';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import KoniTabs from '@subwallet/extension-base/koni/background/handlers/Tabs';

// import Migration from '@subwallet/extension-base/koni/migration';
import { assert } from '@polkadot/util';

export const state = new KoniState();
export const extension = new KoniExtension(state);
export const tabs = new KoniTabs(state);
export const mobile = new Mobile(state);
export const nftHandler = new NftHandler();

export default function handlers<TMessageType extends MessageTypes> ({ id, message, request }: TransportRequestMessage<TMessageType>, port: chrome.runtime.Port, extensionPortName = PORT_EXTENSION): void {
  const isMobile = port.name === PORT_MOBILE;
  const isExtension = port.name === extensionPortName;
  const sender = port.sender as chrome.runtime.MessageSender;
  const from = isExtension
    ? 'extension'
    : (sender.tab && sender.tab.url) || sender.url || '<unknown>';
  const source = `${from}: ${id}: ${message}`;

  const promise = isMobile
    ? mobile.handle(id, message, request, port)
    : isExtension
      ? extension.handle(id, message, request, port)
      : tabs.handle(id, message, request, from, port);

  promise
    .then((response): void => {
      // console.log(`[out] ${source}`); // :: ${JSON.stringify(response)}`);

      // between the start and the end of the promise, the user may have closed
      // the tab, in which case port will be undefined
      assert(port, 'Port has been disconnected');

      port.postMessage({ id, response });
    })
    .catch((error: ProviderError): void => {
      console.error(error);
      console.log(`[err] ${source}:: ${error.message}`);

      // only send message back to port if it's still connected
      if (port) {
        port.postMessage({ error: error.message, errorCode: error.code, errorData: error.data, id });
      }
    });
}
