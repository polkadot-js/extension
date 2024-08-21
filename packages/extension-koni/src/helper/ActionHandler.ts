// Copyright 2019-2022 @subwallet/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MessageTypes, RequestSignatures, TransportRequestMessage } from '@subwallet/extension-base/background/types';
import { PORT_CONTENT, PORT_EXTENSION } from '@subwallet/extension-base/defaults';
import { SWHandler } from '@subwallet/extension-base/koni/background/handlers';
import { createPromiseHandler } from '@subwallet/extension-base/utils/promise';
import { startHeartbeat, stopHeartbeat } from '@subwallet/extension-koni/helper/HeartBeat';

import { assert } from '@polkadot/util';

export type HandlerMethod = <TMessageType extends MessageTypes> ({ id, message, request }: TransportRequestMessage<TMessageType>, port: chrome.runtime.Port) => void;

const SLEEP_TIMEOUT = 60 * 1000;

export class ActionHandler {
  private mainHandler?: SWHandler;
  private waitMainHandler = createPromiseHandler<SWHandler>();

  // Lifecycle handlers
  private connectionMap: Record<string, string> = {};
  private firstTrigger = false;
  private waitFirstTrigger = createPromiseHandler<void>();
  private waitActiveHandler = createPromiseHandler<boolean>();
  public waitFirstActiveMessage = this.waitFirstTrigger.promise;

  private isActive = false;
  private sleepTimeout?: NodeJS.Timeout;

  get isContentConnecting (): boolean {
    return Object.values(this.connectionMap).some((v) => v === PORT_CONTENT);
  }

  get isExtensionConnecting (): boolean {
    return Object.values(this.connectionMap).some((v) => v === PORT_EXTENSION);
  }

  constructor () {
    console.log('ActionHandler init');
  }

  setHandler (handler: SWHandler): void {
    this.mainHandler = handler;
    this.waitMainHandler.resolve(handler);
    this.handleKeyringLock();
  }

  public onInstalled (details: chrome.runtime.InstalledDetails): void {
    (async () => {
      const handler = await this.waitMainHandler.promise;

      handler.state.onInstallOrUpdate(details);
    })().catch(console.error);
  }

  private _getPortId (port: chrome.runtime.Port): string {
    return `${port.sender?.documentId || port.sender?.tab?.id || 'extension-popup'}`;
  }

  private handleKeyringLock () {
    if (this.mainHandler) {
      this.mainHandler.extensionHandler.keyringLockSubscribe((state) => {
        if (state && Object.keys(this.connectionMap).length === 0) {
          stopHeartbeat();
        }
      });
    }
  }

  private async _onPortMessage (port: chrome.runtime.Port, data: TransportRequestMessage<keyof RequestSignatures>, portId: string) {
    // console.debug(data.message, data.id, portId);
    // message and disconnect handlers
    if (!this.mainHandler) {
      this.mainHandler = await this.waitMainHandler.promise;
    }

    const requireActive = data.message !== 'pub(phishing.redirectIfDenied)';

    if (!this.connectionMap[portId] && data?.message && requireActive) {
      this.connectionMap[portId] = port.name;

      if (!this.firstTrigger) {
        this.firstTrigger = true;
        this.waitFirstTrigger.resolve();
      }

      if (this.sleepTimeout) {
        console.debug('Clearing sleep timeout');
        clearTimeout(this.sleepTimeout);
        this.sleepTimeout = undefined;
      }

      if (!this.isActive) {
        this.isActive = true;
        startHeartbeat();
        this.mainHandler && await this.mainHandler.state.wakeup();
        this.waitActiveHandler.resolve(true);
      }
    }

    this.mainHandler.handle(data, port);
  }

  private _onPortDisconnect (port: chrome.runtime.Port, portId: string) {
    if (this.connectionMap[portId]) {
      // console.debug(`Disconnecting port ${portId}`);
      delete this.connectionMap[portId];

      // Set timeout to sleep
      if (Object.keys(this.connectionMap).length === 0) {
        console.debug('Every port is disconnected, set timeout to sleep');
        this.isActive = false;
        this.sleepTimeout && clearTimeout(this.sleepTimeout);
        this.sleepTimeout = setTimeout(() => {
          // Reset active status
          this.waitActiveHandler = createPromiseHandler<boolean>();
          this.mainHandler && this.mainHandler.state.sleep().catch(console.error);
        }, SLEEP_TIMEOUT);
      }
    }
  }

  public handlePort (port: chrome.runtime.Port): void {
    assert([PORT_CONTENT, PORT_EXTENSION].includes(port.name), `Unknown connection from ${port.name}`);
    const portId = this._getPortId(port);
    // console.debug('Handling port', portId);

    port.onMessage.addListener((data: TransportRequestMessage<keyof RequestSignatures>) => {
      this._onPortMessage(port, data, portId).catch(console.error);
    });

    port.onDisconnect.addListener(() => {
      this._onPortDisconnect(port, portId);
    });
  }

  // Singleton
  static _instance: ActionHandler;

  static get instance (): ActionHandler {
    if (!this._instance) {
      this._instance = new ActionHandler();
    }

    return this._instance;
  }
}
