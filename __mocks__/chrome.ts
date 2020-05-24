// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

/* eslint-disable @typescript-eslint/no-explicit-any */
import chrome from 'sinon-chrome';

class MessagingFake {
  private listeners: ((...params: unknown[]) => unknown)[] = [];

  get onMessage (): any {
    return {
      addListener: (cb: (...params: unknown[]) => unknown) => this.listeners.push(cb)
    };
  }

  get onDisconnect (): any {
    return {
      addListener: (): any => undefined
    };
  }

  postMessage (data: unknown): void {
    this.listeners.forEach((cb) => cb.call(this, data));
  }
}

const messagingFake = new MessagingFake();

chrome.runtime.connect.returns(messagingFake);

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(window as any).chrome = chrome;

export default chrome;
