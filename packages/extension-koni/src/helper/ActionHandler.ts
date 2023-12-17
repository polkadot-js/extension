// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MessageTypes, RequestSignatures, TransportRequestMessage } from '@subwallet/extension-base/background/types';
import { PORT_CONTENT, PORT_EXTENSION } from '@subwallet/extension-base/defaults';
import { createPromiseHandler } from '@subwallet/extension-base/utils/promise';

import { assert } from '@polkadot/util';

export type HandlerMethod = <TMessageType extends MessageTypes> ({ id, message, request }: TransportRequestMessage<TMessageType>, port: chrome.runtime.Port, extensionPortName?: string) => void;

const SLEEP_TIMEOUT = 60 * 1000;

export class ActionHandler {
  // Common handlers
  private waitStartHandler = createPromiseHandler<() => void>();
  private waitInstallHandler = createPromiseHandler<(details: chrome.runtime.InstalledDetails) => void>();
  private waitActiveHandler = createPromiseHandler<boolean>();

  // Port handlers
  private portHandler?: HandlerMethod;
  private waitPortHandler = createPromiseHandler<HandlerMethod>();

  // Lifecycle handlers
  private connectionMap: Record<string, string> = {};
  private firstTrigger = false;
  private waitFirstTrigger = createPromiseHandler<void>();
  public waitFirstActiveMessage = this.waitFirstTrigger.promise;

  private wakeUpHandler?: () => Promise<void>;
  private sleepHandler?: () => Promise<void>;
  private isActive = false;
  private sleepTimeout?: NodeJS.Timeout;

  get isContentConnecting (): boolean {
    return Object.values(this.connectionMap).some((v) => v === PORT_CONTENT);
  }

  get isExtensionConnecting (): boolean {
    return Object.values(this.connectionMap).some((v) => v === PORT_EXTENSION);
  }

  constructor () {
    // Set timeout for all required handlers
    setTimeout(() => {
      this.waitPortHandler.reject(new Error('Timeout while waiting for port handler'));
      this.waitInstallHandler.reject(new Error('Timeout while waiting for install handler'));
      // this.waitStartHandler.reject(new Error('Timeout while waiting for start handler'));
    }, 12000);
  }

  public setPortHandler (handler: HandlerMethod): void {
    this.waitPortHandler.resolve(handler);
  }

  public setInstallHandler (handler: (details: chrome.runtime.InstalledDetails) => void): void {
    this.waitInstallHandler.resolve(handler);
  }

  public onInstalled (details: chrome.runtime.InstalledDetails): void {
    this.waitInstallHandler.promise.then((handler) => {
      handler(details);
    }).catch(console.error);
  }

  public setStartHandler (handler: () => void): void {
    this.waitStartHandler.resolve(handler);
  }

  public onStartup (): void {
    this.waitStartHandler.promise.then((handler) => {
      handler();
    }).catch(console.error);
  }

  setWakeUpHandler (handler: () => Promise<void>): void {
    this.wakeUpHandler = handler;
  }

  setSleepHandler (handler: () => Promise<void>): void {
    this.sleepHandler = handler;
  }

  private _getPortId (port: chrome.runtime.Port): string {
    return `${port.sender?.documentId || 'extension-popup'}`;
  }

  private async _onPortMessage (port: chrome.runtime.Port, data: TransportRequestMessage<keyof RequestSignatures>, portId: string) {
    // message and disconnect handlers
    if (!this.portHandler) {
      this.portHandler = await this.waitPortHandler.promise;
    }

    const requireActive = data.message !== 'pub(phishing.redirectIfDenied)';

    if (!this.connectionMap[portId] && data?.message && requireActive) {
      this.connectionMap[portId] = port.name;

      if (!this.firstTrigger) {
        console.log('Check ddd', portId, data.message);
        this.firstTrigger = true;
        this.waitFirstTrigger.resolve();
      }

      if (this.sleepTimeout) {
        clearTimeout(this.sleepTimeout);
        this.sleepTimeout = undefined;
      }

      if (!this.isActive) {
        this.isActive = true;
        this.wakeUpHandler && await this.wakeUpHandler();
        this.waitActiveHandler.resolve(true);
      }
    }

    this.portHandler(data, port);
  }

  private _onPortDisconnect (port: chrome.runtime.Port, portId: string) {
    if (this.connectionMap[portId]) {
      delete this.connectionMap[portId];

      // Set timeout to sleep
      if (Object.keys(this.connectionMap).length === 0) {
        this.sleepTimeout && clearTimeout(this.sleepTimeout);
        this.sleepTimeout = setTimeout(() => {
          // Reset active status
          this.isActive = false;
          this.waitActiveHandler = createPromiseHandler<boolean>();
          this.sleepHandler && this.sleepHandler().catch(console.error);
        }, SLEEP_TIMEOUT);
      }
    }
  }

  public handlePort (port: chrome.runtime.Port): void {
    assert([PORT_CONTENT, PORT_EXTENSION].includes(port.name), `Unknown connection from ${port.name}`);
    const portId = this._getPortId(port);

    port.onMessage.addListener((data: TransportRequestMessage<keyof RequestSignatures>) => {
      this._onPortMessage(port, data, portId).catch(console.error);
    });

    port.onDisconnect.addListener(() => {
      this._onPortDisconnect(port, portId);
    });
  }

  // Singleton
  static instance: ActionHandler;

  static getInstance (): ActionHandler {
    if (!this.instance) {
      this.instance = new ActionHandler();
    }

    return this.instance;
  }
}
