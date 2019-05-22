// Copyright 2019 @polkadot/extension-bg authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AuthorizeRequest, MessageAuthorize, MessageExtrinsicSign, MessageExtrinsicSign$Response, SigningRequest } from '../types';

import { assert } from '@polkadot/util';

type AuthRequest = {
  id: number,
  request: MessageAuthorize,
  resolve: (result: boolean) => void,
  reject: (error: Error) => void,
  url: string
};

type AuthUrls = {
  [index: string]: {
    count: number,
    id: string,
    isAllowed: boolean,
    origin: string,
    url: string
  }
};

type SignRequest = {
  id: number,
  request: MessageExtrinsicSign,
  resolve: (result: MessageExtrinsicSign$Response) => void,
  reject: (error: Error) => void,
  url: string
};

let idCounter = 0;

export default class State {
  // at the moment, we are keeping the list in memory - this should be persisted
  private _authUrls: AuthUrls = {};
  private _authRequests: { [index: number]: AuthRequest } = {};
  private _signRequests: { [index: number]: SignRequest } = {};

  get hasAuthRequests (): boolean {
    return this.numAuthRequests === 0;
  }

  get hasSignRequests (): boolean {
    return this.numSignRequests === 0;
  }

  get numAuthRequests (): number {
    return Object.keys(this._authRequests).length;
  }

  get numSignRequests (): number {
    return Object.keys(this._signRequests).length;
  }

  get allAuthRequests (): Array<AuthorizeRequest> {
    return Object
      .values(this._authRequests)
      .map(({ id, request, url }) => [id, request, url]);
  }

  get allSignRequests (): Array<SigningRequest> {
    return Object
      .values(this._signRequests)
      .map(({ id, request, url }) => [id, request, url]);
  }

  private authComplete = (id: number, fn: Function) => {
    return (result: boolean | Error): void => {
      delete this._authRequests[id];
      this.updateIcon();

      fn(result);
    };
  }

  private signComplete = (id: number, fn: Function) => {
    return (result: MessageExtrinsicSign$Response | Error): void => {
      delete this._signRequests[id];
      this.updateIcon();

      fn(result);
    };
  }

  private stripUrl (url: string): string {
    assert(url && (url.indexOf('http:') === 0 || url.indexOf('http:') === 0), `Invalid url ${url}, expected to start with http: or https:`);

    const parts = url.split('/');

    return parts[2];
  }

  private updateIcon (): void {
    const authCount = this.numAuthRequests;
    const signCount = this.numSignRequests;
    const text = (
      authCount
        ? `! ${authCount}`
        : (signCount ? `+ ${signCount}` : '')
    );

    chrome.browserAction.setBadgeText({ text });
  }

  async autorizeUrl (url: string, request: MessageAuthorize): Promise<boolean> {
    const id = this.stripUrl(url);

    if (this._authUrls[id]) {
      assert(this._authUrls[id].isAllowed, `The source ${url} is not allowed to interact with this extension`);

      return true;
    }

    return new Promise((resolve, reject) => {
      const id = ++idCounter;

      this._authRequests[id] = {
        id,
        request,
        resolve: this.authComplete(id, resolve),
        reject: this.authComplete(id, reject),
        url
      };

      this.updateIcon();
    });
  }

  isUrlAuthorized (url: string): boolean {
    const entry = this._authUrls[this.stripUrl(url)];

    assert(entry, `The source ${url} has not been enabled yet`);
    assert(entry.isAllowed, `The source ${url} is not allowed to interact with this extension`);

    return true;
  }

  getAuthRequest (id: number): AuthRequest {
    return this._authRequests[id];
  }

  getSignRequest (id: number): SignRequest {
    return this._signRequests[id];
  }

  signQueue (url: string, request: MessageExtrinsicSign): Promise<MessageExtrinsicSign$Response> {
    const id = ++idCounter;

    return new Promise((resolve, reject) => {
      this._signRequests[id] = {
        id,
        request,
        resolve: this.signComplete(id, resolve),
        reject: this.signComplete(id, reject),
        url
      };

      this.updateIcon();
    });
  }
}
