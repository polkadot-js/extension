// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

/* eslint-disable @typescript-eslint/no-explicit-any */
import chrome from 'sinon-chrome';

class MessagingFake {
  private listeners: any = [];

  get onMessage (): any {
    return {
      addListener: (cb: any): any => this.listeners.push(cb)
    };
  }

  get onDisconnect (): any {
    return {
      addListener: (): any => undefined
    };
  }

  postMessage (data: any): void {
    this.listeners.forEach((cb: any) => cb.call(this, data));
  }
}

const messagingFake = new MessagingFake();

chrome.runtime.connect.returns(messagingFake);

export default chrome;
