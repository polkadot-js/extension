// Copyright 2019-2020 @polkadot/extension-bg authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson, AuthorizeRequest, RequestAuthorizeTab, RequestSign, ResponseSigning, SigningRequest } from '../types';
import { IconOptions, Providers } from './types';

import { BehaviorSubject } from 'rxjs';
import { assert } from '@polkadot/util';

import chrome from '../../chrome';
import StateMetadata from './StateMetadata';
import StateRpc from './StateRpc';
import { getId, stripUrl } from './util';

interface AuthRequest {
  id: string;
  idStr: string;
  request: RequestAuthorizeTab;
  resolve: (result: boolean) => void;
  reject: (error: Error) => void;
  url: string;
}

type AuthUrls = Record<string, {
  count: number;
  id: string;
  isAllowed: boolean;
  origin: string;
  url: string;
}>;

interface SignRequest {
  account: AccountJson;
  id: string;
  request: RequestSign;
  resolve: (result: ResponseSigning) => void;
  reject: (error: Error) => void;
  url: string;
}

const WINDOW_OPTS = {
  // This is not allowed on FF, only on Chrome - disable completely
  // focused: true,
  height: 621,
  left: 150,
  top: 150,
  type: 'popup',
  url: chrome.extension.getURL('index.html'),
  width: 480
};

export default class State {
  readonly #authUrls: AuthUrls = {};

  readonly #authRequests: Record<string, AuthRequest> = {};

  readonly #signRequests: Record<string, SignRequest> = {};

  #windows: number[] = [];

  public readonly authSubject: BehaviorSubject<AuthorizeRequest[]> = new BehaviorSubject<AuthorizeRequest[]>([]);

  public readonly signSubject: BehaviorSubject<SigningRequest[]> = new BehaviorSubject<SigningRequest[]>([]);

  public readonly metadata: StateMetadata;

  public readonly rpc: StateRpc;

  constructor (providers?: Providers) {
    this.metadata = new StateMetadata(this.updateIcon);
    this.rpc = new StateRpc(providers);
  }

  public get numAuthRequests (): number {
    return Object.keys(this.#authRequests).length;
  }

  public get numSignRequests (): number {
    return Object.keys(this.#signRequests).length;
  }

  public get allAuthRequests (): AuthorizeRequest[] {
    return Object
      .values(this.#authRequests)
      .map(({ id, request, url }): AuthorizeRequest => ({ id, request, url }));
  }

  public get allSignRequests (): SigningRequest[] {
    return Object
      .values(this.#signRequests)
      .map(({ account, id, request, url }): SigningRequest => ({ account, id, request, url }));
  }

  private authComplete = (id: string, fn: Function): (result: boolean | Error) => void => {
    return (result: boolean | Error): void => {
      const isAllowed = result === true;
      const { idStr, request: { origin }, url } = this.#authRequests[id];

      this.#authUrls[stripUrl(url)] = {
        count: 0,
        id: idStr,
        isAllowed,
        origin,
        url
      };

      delete this.#authRequests[id];
      this.updateIconAuth({ shouldClose: true });

      fn(result);
    };
  }

  private signComplete = (id: string, fn: Function): (result: ResponseSigning | Error) => void => {
    return (result: ResponseSigning | Error): void => {
      delete this.#signRequests[id];
      this.updateIconSign({ shouldClose: true });

      fn(result);
    };
  }

  private updateIcon = ({ shouldClose, shouldOpen }: IconOptions = {}): void => {
    const authCount = this.numAuthRequests;
    const metaCount = this.metadata.numRequests;
    const signCount = this.numSignRequests;
    const text = (
      authCount
        ? 'Auth'
        : metaCount
          ? 'Meta'
          : (signCount ? `${signCount}` : '')
    );

    chrome.browserAction.setBadgeText({ text });

    if (shouldClose && text === '') {
      this.#windows.forEach((id: number) => chrome.windows.remove(id));
      this.#windows = [];
    } else if (shouldOpen && text !== '') {
      chrome.windows.create({ ...WINDOW_OPTS }, (window?: chrome.windows.Window): void => {
        if (window) {
          this.#windows.push(window.id);
        }
      });
    }
  }

  private updateIconAuth (options?: IconOptions): void {
    this.authSubject.next(this.allAuthRequests);
    this.updateIcon(options);
  }

  private updateIconSign (options?: IconOptions): void {
    this.signSubject.next(this.allSignRequests);
    this.updateIcon(options);
  }

  public async authorizeUrl (url: string, request: RequestAuthorizeTab): Promise<boolean> {
    const idStr = stripUrl(url);

    if (this.#authUrls[idStr]) {
      assert(this.#authUrls[idStr].isAllowed, `The source ${url} is not allowed to interact with this extension`);

      return false;
    }

    return new Promise((resolve, reject): void => {
      const id = getId();

      this.#authRequests[id] = {
        id,
        idStr,
        reject: this.authComplete(id, reject),
        request,
        resolve: this.authComplete(id, resolve),
        url
      };

      this.updateIconAuth({ shouldOpen: true });
    });
  }

  public ensureUrlAuthorized (url: string): boolean {
    const entry = this.#authUrls[stripUrl(url)];

    assert(entry, `The source ${url} has not been enabled yet`);
    assert(entry.isAllowed, `The source ${url} is not allowed to interact with this extension`);

    return true;
  }

  public getAuthRequest (id: string): AuthRequest {
    return this.#authRequests[id];
  }

  public getSignRequest (id: string): SignRequest {
    return this.#signRequests[id];
  }

  public sign (url: string, request: RequestSign, account: AccountJson): Promise<ResponseSigning> {
    const id = getId();

    return new Promise((resolve, reject): void => {
      this.#signRequests[id] = {
        account,
        id,
        reject: this.signComplete(id, reject),
        request,
        resolve: this.signComplete(id, resolve),
        url
      };

      this.updateIconSign({ shouldOpen: true });
    });
  }
}
