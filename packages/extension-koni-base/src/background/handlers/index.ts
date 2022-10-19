// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MessageTypes, TransportRequestMessage } from '@subwallet/extension-base/background/types';
import { PORT_EXTENSION } from '@subwallet/extension-base/defaults';
import { SubWalletProviderError } from '@subwallet/extension-base/errors/SubWalletProviderError';
import { NftHandler } from '@subwallet/extension-koni-base/api/nft';
import KoniExtension from '@subwallet/extension-koni-base/background/handlers/Extension';
import KoniState from '@subwallet/extension-koni-base/background/handlers/State';
import KoniTabs from '@subwallet/extension-koni-base/background/handlers/Tabs';
import Migration from '@subwallet/extension-koni-base/migration';

import { assert } from '@polkadot/util';

export const state = new KoniState();
export const extension = new KoniExtension(state);
export const tabs = new KoniTabs(state);
export const nftHandler = new NftHandler();

// Migration
async function makeSureStateReady () {
  const poll = (resolve: (value: unknown) => void) => {
    if (state.isReady()) {
      resolve(true);
    } else {
      console.log('Waiting for State is ready...');
      setTimeout(() => poll(resolve), 400);
    }
  };

  return new Promise(poll);
}

makeSureStateReady().then(() => {
  const migration = new Migration(state);

  migration.run().catch((err) => console.warn(err));
}).catch((e) => console.warn(e));

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
    .catch((error: SubWalletProviderError): void => {
      console.error(error);
      console.log(`[err] ${source}:: ${error.message}`);

      // only send message back to port if it's still connected
      if (port) {
        port.postMessage({ error: error.message, errorCode: error.code, errorData: error.data, id });
      }
    });
}
