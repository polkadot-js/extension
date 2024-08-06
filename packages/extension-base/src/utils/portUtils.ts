// Copyright 2019-2024 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Message } from '@polkadot/extension-base/types';

import { chrome } from '@polkadot/extension-inject/chrome';

export function setupPort (portName: string, onMessageHandler: (data: Message['data']) => void, onDisconnectHandler: () => void): chrome.runtime.Port {
  const port = chrome.runtime.connect({ name: portName });

  port.onMessage.addListener(onMessageHandler);

  port.onDisconnect.addListener(() => {
    console.log(`Disconnected from ${portName}`);
    onDisconnectHandler();
  });

  return port;
}

export async function wakeUpServiceWorker (): Promise<{ status: string }> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'wakeup' }, (response: { status: string }) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// This object is required to allow jest.spyOn to be used to create a mock Implementation for testing
export const wakeUpServiceWorkerWrapper = { wakeUpServiceWorker };

export async function ensurePortConnection (
  portRef: chrome.runtime.Port | undefined,
  portConfig: {
    portName: string,
    onPortMessageHandler: (data: Message['data']) => void,
    onPortDisconnectHandler: () => void
  }
): Promise<chrome.runtime.Port> {
  const maxAttempts = 5;
  const delayMs = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await wakeUpServiceWorkerWrapper.wakeUpServiceWorker();

      if (response?.status === 'awake') {
        if (!portRef) {
          return setupPort(portConfig.portName, portConfig.onPortMessageHandler, portConfig.onPortDisconnectHandler);
        }

        return portRef;
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed: ${(error as Error).message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Failed to wake up the service worker and setup the port after multiple attempts');
}
