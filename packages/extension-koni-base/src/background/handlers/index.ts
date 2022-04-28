// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BackgroundWindow } from '@polkadot/extension-base/background/KoniTypes';
import { MessageTypes, TransportRequestMessage } from '@polkadot/extension-base/background/types';
import { PORT_EXTENSION } from '@polkadot/extension-base/defaults';
import { NftHandler } from '@polkadot/extension-koni-base/api/nft';
import KoniExtension from '@polkadot/extension-koni-base/background/handlers/Extension';
import KoniState from '@polkadot/extension-koni-base/background/handlers/State';
import KoniTabs from '@polkadot/extension-koni-base/background/handlers/Tabs';
import { getCurrentProvider } from '@polkadot/extension-koni-base/utils/utils';
import { assert } from '@polkadot/util';

export const state = new KoniState();

state.initNetworkStates();

export const extension = new KoniExtension(state);
export const tabs = new KoniTabs(state);
export const nftHandler = new NftHandler(state.getApiMap().dotSama);

function getRpcsMap (): Record<string, string> {
  const result: Record<string, string> = {};
  const networkMap = state.getNetworkMap();

  Object.keys(networkMap).forEach((networkKey) => {
    const networkInfo = networkMap[networkKey];

    if (!networkInfo.genesisHash || networkInfo.genesisHash.toLowerCase() === 'unknown') {
      return;
    }

    result[networkKey] = getCurrentProvider(networkMap[networkKey]);
  });

  return result;
}

export const rpcsMap: Record<string, string> = getRpcsMap();

state.updateServiceInfo();

export function initBackgroundWindow (keyring: any) {
  (window as any as BackgroundWindow).pdotApi = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    keyring,
    apisMap: state.getApiMap().dotSama
  };
}

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
