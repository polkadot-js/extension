// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Message } from '@subwallet/extension-base/types';

import { TransportRequestMessage } from '@subwallet/extension-base/background/types';
import { MESSAGE_ORIGIN_CONTENT, MESSAGE_ORIGIN_PAGE, PORT_CONTENT } from '@subwallet/extension-base/defaults';
import { getId } from '@subwallet/extension-base/utils/getId';
import { addNotificationPopUp } from '@subwallet/extension-koni/helper/PageNotification';

const handleRedirectPhishing: { id: string, resolve?: (value: (boolean | PromiseLike<boolean>)) => void, reject?: (e: Error) => void } = {
  id: 'redirect-phishing-' + getId()
};

function checkForLastError () {
  const { lastError } = chrome.runtime;

  if (!lastError) {
    return undefined;
  }

  // repair incomplete error object (eg chromium v77)
  return new Error(lastError.message);
}

export class ContentHandler {
  port?: chrome.runtime.Port;
  isShowNotification = false;
  isConnected = false;

  // Get the port to communicate with the background and init handlers
  getPort (): chrome.runtime.Port {
    if (!this.port) {
      const port = chrome.runtime.connect({ name: PORT_CONTENT });
      const onMessageHandler = this.onPortMessageHandler.bind(this);

      const disconnectHandler = () => {
        this.onDisconnectPort(port, onMessageHandler, disconnectHandler);
      };

      this.port = port;
      this.port.onMessage.addListener(onMessageHandler);
      this.port.onDisconnect.addListener(disconnectHandler);
    }

    return this.port;
  }

  // Handle messages from the background
  onPortMessageHandler (data: {id: string, response: any}): void {
    const { id, resolve } = handleRedirectPhishing;

    if (data?.id === id) {
      resolve && resolve(Boolean(data.response));
    } else {
      window.postMessage({ ...data, origin: MESSAGE_ORIGIN_CONTENT }, '*');
    }
  }

  // Handle disconnecting the port from the background
  onDisconnectPort (port: chrome.runtime.Port, onMessage: (data: {id: string, response: any}) => void, onDisconnect: () => void): void {
    const err = checkForLastError();

    if (err) {
      console.warn(`${err.message}, port is disconnected.`);
    }

    port.onMessage.removeListener(onMessage);
    port.onDisconnect.removeListener(onDisconnect);

    this.port = undefined;
  }

  // Handle messages from the webpage
  onPageMessage ({ data, source }: Message): void {
    // only allow messages from our window, by the inject
    if (source !== window || data.origin !== MESSAGE_ORIGIN_PAGE) {
      return;
    }

    try {
      this.isConnected = true;
      this.getPort().postMessage(data);
    } catch (e) {
      console.error(e);

      if (!this.isShowNotification) {
        console.log('The SubWallet extension is not installed. Please install the extension to use the wallet.');
        addNotificationPopUp();
        this.isShowNotification = true;

        setTimeout(() => {
          this.isShowNotification = false;
        }, 5000);
      }
    }
  }

  // Detect phishing by URL
  redirectIfPhishingProm (): void {
    new Promise<boolean>((resolve, reject) => {
      handleRedirectPhishing.resolve = resolve;
      handleRedirectPhishing.reject = reject;

      const transportRequestMessage: TransportRequestMessage<'pub(phishing.redirectIfDenied)'> = {
        id: handleRedirectPhishing.id,
        message: 'pub(phishing.redirectIfDenied)',
        origin: MESSAGE_ORIGIN_PAGE,
        request: null
      };

      this.getPort().postMessage(transportRequestMessage);
    }).then((gotRedirected) => {
      if (!gotRedirected) {
        console.log('Check phishing by URL: Passed.');
      }
    }).catch((e) => {
      console.warn(`Unable to determine if the site is in the phishing list: ${(e as Error).message}`);
    });
  }

  constructor () {
    this.redirectIfPhishingProm();
    window.addEventListener('message', this.onPageMessage.bind(this));
  }
}

// @ts-ignore
const contentHandler = new ContentHandler();
