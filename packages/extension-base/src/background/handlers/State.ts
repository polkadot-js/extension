// Copyright 2019-2020 @polkadot/extension-bg authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { knownMetadata, addMetadata } from '@polkadot/extension-chains';
import { MetadataDef } from '@polkadot/extension-inject/types';
import { AccountJson, AuthorizeRequest, MetadataRequest, RequestAuthorizeTab, RequestSign, ResponseSigning, SigningRequest } from '../types';
import { Providers } from './types';

import { BehaviorSubject } from 'rxjs';
import { assert } from '@polkadot/util';

import chrome from '../../chrome';
import { MetadataStore } from '../stores';
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

interface MetaRequest {
  id: string;
  request: MetadataDef;
  resolve: (result: boolean) => void;
  reject: (error: Error) => void;
  url: string;
}

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

export default class State extends StateRpc {
  readonly #authUrls: AuthUrls = {};

  readonly #authRequests: Record<string, AuthRequest> = {};

  readonly #metaStore = new MetadataStore();

  readonly #metaRequests: Record<string, MetaRequest> = {};

  readonly #signRequests: Record<string, SignRequest> = {};

  #windows: number[] = [];

  public readonly authSubject: BehaviorSubject<AuthorizeRequest[]> = new BehaviorSubject<AuthorizeRequest[]>([]);

  public readonly metaSubject: BehaviorSubject<MetadataRequest[]> = new BehaviorSubject<MetadataRequest[]>([]);

  public readonly signSubject: BehaviorSubject<SigningRequest[]> = new BehaviorSubject<SigningRequest[]>([]);

  constructor (providers?: Providers) {
    super(providers);

    this.#metaStore.all((key: string, def: MetadataDef): void => {
      if (key.startsWith('metadata:')) {
        addMetadata(def);
      }
    });
  }

  public get knownMetadata (): MetadataDef[] {
    return knownMetadata();
  }

  public get numAuthRequests (): number {
    return Object.keys(this.#authRequests).length;
  }

  public get numMetaRequests (): number {
    return Object.keys(this.#metaRequests).length;
  }

  public get numSignRequests (): number {
    return Object.keys(this.#signRequests).length;
  }

  public get allAuthRequests (): AuthorizeRequest[] {
    return Object
      .values(this.#authRequests)
      .map(({ id, request, url }): AuthorizeRequest => ({ id, request, url }));
  }

  public get allMetaRequests (): MetadataRequest[] {
    return Object
      .values(this.#metaRequests)
      .map(({ id, request, url }): MetadataRequest => ({ id, request, url }));
  }

  public get allSignRequests (): SigningRequest[] {
    return Object
      .values(this.#signRequests)
      .map(({ account, id, request, url }): SigningRequest => ({ account, id, request, url }));
  }

  private popupClose (): void {
    this.#windows.forEach((id: number): void =>
      chrome.windows.remove(id)
    );
    this.#windows = [];
  }

  private popupOpen (): void {
    chrome.windows.create({ ...WINDOW_OPTS }, (window?: chrome.windows.Window): void => {
      if (window) {
        this.#windows.push(window.id);
      }
    });
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
      this.updateIconAuth(true);

      fn(result);
    };
  }

  private metaComplete = (id: string, fn: Function): (result: boolean | Error) => void => {
    return (result: boolean | Error): void => {
      delete this.#metaRequests[id];
      this.updateIconMeta(true);

      fn(result);
    };
  }

  private signComplete = (id: string, fn: Function): (result: ResponseSigning | Error) => void => {
    return (result: ResponseSigning | Error): void => {
      delete this.#signRequests[id];
      this.updateIconSign(true);

      fn(result);
    };
  }

  private updateIcon (shouldClose?: boolean): void {
    const authCount = this.numAuthRequests;
    const metaCount = this.numMetaRequests;
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
      this.popupClose();
    }
  }

  private updateIconAuth (shouldClose?: boolean): void {
    this.authSubject.next(this.allAuthRequests);
    this.updateIcon(shouldClose);
  }

  private updateIconMeta (shouldClose?: boolean): void {
    this.metaSubject.next(this.allMetaRequests);
    this.updateIcon(shouldClose);
  }

  private updateIconSign (shouldClose?: boolean): void {
    this.signSubject.next(this.allSignRequests);
    this.updateIcon(shouldClose);
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

      this.updateIconAuth();
      this.popupOpen();
    });
  }

  public ensureUrlAuthorized (url: string): boolean {
    const entry = this.#authUrls[stripUrl(url)];

    assert(entry, `The source ${url} has not been enabled yet`);
    assert(entry.isAllowed, `The source ${url} is not allowed to interact with this extension`);

    return true;
  }

  public injectMetadata (url: string, request: MetadataDef): Promise<boolean> {
    return new Promise((resolve, reject): void => {
      const id = getId();

      this.#metaRequests[id] = {
        id,
        reject: this.metaComplete(id, reject),
        request,
        resolve: this.metaComplete(id, resolve),
        url
      };

      this.updateIconMeta();
      this.popupOpen();
    });
  }

  public getAuthRequest (id: string): AuthRequest {
    return this.#authRequests[id];
  }

  public getMetaRequest (id: string): MetaRequest {
    return this.#metaRequests[id];
  }

  public getSignRequest (id: string): SignRequest {
    return this.#signRequests[id];
  }

  public saveMetadata (meta: MetadataDef): void {
    this.#metaStore.set(`metadata:${meta.genesisHash}`, meta);

    addMetadata(meta);
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

      this.updateIconSign();
      this.popupOpen();
    });
  }
}
