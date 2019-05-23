// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageExtrinsicSign, MessageExtrinsicSign$Response } from '../types';

import extension from 'extensionizer';

type Request = {
  id: number,
  request: MessageExtrinsicSign,
  resolve: (result: MessageExtrinsicSign$Response) => void,
  reject: (error: Error) => void,
  url: string
};

export default class SigningRequests {
  private _requests: { [index: number]: Request } = {};

  get hasRequests (): boolean {
    return this.numRequests === 0;
  }

  get numRequests (): number {
    return Object.keys(this._requests).length;
  }

  get requests (): Array<[number, MessageExtrinsicSign, string]> {
    return Object
      .values(this._requests)
      .map(({ id, request, url }) => [id, request, url]);
  }

  private complete = (id: number, fn: Function) => {
    return (result: MessageExtrinsicSign$Response | Error): void => {
      delete this._requests[id];
      this.updateIcon();

      fn(result);
    };
  }

  private updateIcon (): void {
    const count = this.numRequests;

    extension.browserAction.setBadgeText({ text: count ? `${this.numRequests}` : '' });
  }

  get (id: number): Request {
    return this._requests[id];
  }

  queue (id: number, request: MessageExtrinsicSign, url: string): Promise<MessageExtrinsicSign$Response> {
    return new Promise((resolve, reject) => {
      this._requests[id] = {
        id,
        request,
        resolve: this.complete(id, resolve),
        reject: this.complete(id, reject),
        url
      };

      this.updateIcon();
    });
  }
}
