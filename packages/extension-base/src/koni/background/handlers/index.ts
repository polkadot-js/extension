// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ProviderError } from '@subwallet/extension-base/background/errors/ProviderError';
import { MessageTypes, TransportRequestMessage } from '@subwallet/extension-base/background/types';
import { PORT_EXTENSION, PORT_MOBILE } from '@subwallet/extension-base/defaults';
import KoniExtension from '@subwallet/extension-base/koni/background/handlers/Extension';
import Mobile from '@subwallet/extension-base/koni/background/handlers/Mobile';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import KoniTabs from '@subwallet/extension-base/koni/background/handlers/Tabs';

import { assert } from '@polkadot/util';

export class SWHandler {
  _state?: KoniState;
  _extensionHandler?: KoniExtension;
  _tabsHandler?: KoniTabs;
  _mobileHandler?: Mobile;

  public get state (): KoniState {
    if (!this._state) {
      this._state = new KoniState();
    }

    return this._state;
  }

  public get extensionHandler (): KoniExtension {
    if (!this._extensionHandler) {
      this._extensionHandler = new KoniExtension(this.state);
    }

    return this._extensionHandler;
  }

  public get tabHandler (): KoniTabs {
    if (!this._tabsHandler) {
      this._tabsHandler = new KoniTabs(this.state);
    }

    return this._tabsHandler;
  }

  public get mobileHandler (): Mobile {
    if (!this._mobileHandler) {
      this._mobileHandler = new Mobile(this.state);
    }

    return this._mobileHandler;
  }

  public handle<TMessageType extends MessageTypes> ({ id, message, request }: TransportRequestMessage<TMessageType>, port: chrome.runtime.Port): void {
    const isMobile = port.name === PORT_MOBILE;
    const isExtension = port.name === PORT_EXTENSION;
    const sender = port.sender;
    // console.debug('Handle', message);

    const from = isExtension
      ? 'extension'
      : sender?.url || (sender?.tab && sender?.tab.url) || '<unknown>';
    const source = `${from}: ${id}: ${message}`;

    const promise = isMobile
      ? this.mobileHandler.handle(id, message, request, port)
      : isExtension
        ? this.extensionHandler.handle(id, message, request, port)
        : this.tabHandler.handle(id, message, request, from, port);

    promise
      .then((response): void => {
      // console.log(`[out] ${source}`); // :: ${JSON.stringify(response)}`);

        // between the start and the end of the promise, the user may have closed
        // the tab, in which case port will be undefined
        assert(port, 'Port has been disconnected');

        port.postMessage({ id, response, sender: 'BACKGROUND' });
      })
      .catch((error: ProviderError): void => {
        console.error(error);
        console.log(`[err] ${source}:: ${error.message}`);

        // only send message back to port if it's still connected
        if (port) {
          port.postMessage({ error: error.message, errorCode: error.code, errorData: error.data, id, sender: 'BACKGROUND' });
        }
      });
  }

  // Singleton
  private static _instance: SWHandler;
  public static get instance (): SWHandler {
    if (!SWHandler._instance) {
      SWHandler._instance = new SWHandler();
    }

    return SWHandler._instance;
  }
}
