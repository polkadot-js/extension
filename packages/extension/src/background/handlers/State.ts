// Copyright 2019-2020 @polkadot/extension-bg authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ProviderMeta } from '@polkadot/extension-inject/types';
import { JsonRpcResponse, ProviderInterface, ProviderInterfaceCallback } from '@polkadot/rpc-provider/types';

import { AccountJson, AuthorizeRequest, RequestAuthorizeTab, RequestRpcSend, RequestRpcSubscribe, RequestSign, ResponseRpcListProviders, ResponseSigning, SigningRequest, RequestRpcUnsubscribe } from '../types';

import extension from 'extensionizer';
import { BehaviorSubject } from 'rxjs';
import { assert } from '@polkadot/util';

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

// List of providers passed into constructor. This is the list of providers
// exposed by the extension.
type Providers = Record<string, {
  meta: ProviderMeta;
  // The provider is not running at init, calling this will instantiate the
  // provider.
  start: () => ProviderInterface;
}>

interface SignRequest {
  account: AccountJson;
  id: string;
  request: RequestSign;
  resolve: (result: ResponseSigning) => void;
  reject: (error: Error) => void;
  url: string;
}

let idCounter = 0;

const WINDOW_OPTS = {
  // This is not allowed on FF, only on Chrome - disable completely
  // focused: true,
  height: 621,
  left: 150,
  top: 150,
  type: 'popup',
  url: extension.extension.getURL('index.html'),
  width: 480
};

function getId (): string {
  return `${Date.now()}.${++idCounter}`;
}

export default class State {
  readonly #authUrls: AuthUrls = {};

  readonly #authRequests: Record<string, AuthRequest> = {};

  // Map of providers currently injected in tabs
  readonly #injectedProviders: Map<chrome.runtime.Port, ProviderInterface> = new Map();

  // Map of all providers exposed by the extension, they are retrievable by key
  readonly #providers: Providers;

  readonly #signRequests: Record<string, SignRequest> = {};

  #windows: number[] = [];

  public readonly authSubject: BehaviorSubject<AuthorizeRequest[]> = new BehaviorSubject([] as AuthorizeRequest[]);

  public readonly signSubject: BehaviorSubject<SigningRequest[]> = new BehaviorSubject([] as SigningRequest[]);

  constructor (providers: Providers = {}) {
    this.#providers = providers;
  }

  public get hasAuthRequests (): boolean {
    return this.numAuthRequests === 0;
  }

  public get hasSignRequests (): boolean {
    return this.numSignRequests === 0;
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

  private popupClose (): void {
    this.#windows.forEach((id: number): void =>
      extension.windows.remove(id)
    );
    this.#windows = [];
  }

  private popupOpen (): void {
    extension.windows.create({ ...WINDOW_OPTS }, (window?: chrome.windows.Window): void => {
      if (window) {
        this.#windows.push(window.id);
      }
    });
  }

  private authComplete = (id: string, fn: Function): (result: boolean | Error) => void => {
    return (result: boolean | Error): void => {
      const isAllowed = result === true;
      const { idStr, request: { origin }, url } = this.#authRequests[id];

      this.#authUrls[this.stripUrl(url)] = {
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

  // If a provider is already running, return it, or else start it
  private getProvider (port: chrome.runtime.Port): ProviderInterface | undefined {
    if (!this.#injectedProviders.has(port)) {
      throw new Error(`Port ${port.name} has no provider, please call pub(rpc.startProvider) first`);
    }

    return this.#injectedProviders.get(port) as ProviderInterface;
  }

  private signComplete = (id: string, fn: Function): (result: ResponseSigning | Error) => void => {
    return (result: ResponseSigning | Error): void => {
      delete this.#signRequests[id];
      this.updateIconSign(true);

      fn(result);
    };
  }

  private stripUrl (url: string): string {
    assert(url && (url.startsWith('http:') || url.startsWith('https:')), `Invalid url ${url}, expected to start with http: or https:`);

    const parts = url.split('/');

    return parts[2];
  }

  private updateIcon (shouldClose?: boolean): void {
    const authCount = this.numAuthRequests;
    const signCount = this.numSignRequests;
    const text = (
      authCount
        ? 'Auth'
        : (signCount ? `${signCount}` : '')
    );

    extension.browserAction.setBadgeText({ text });

    if (shouldClose && text === '') {
      this.popupClose();
    }
  }

  private updateIconAuth (shouldClose?: boolean): void {
    this.authSubject.next(this.allAuthRequests);
    this.updateIcon(shouldClose);
  }

  private updateIconSign (shouldClose?: boolean): void {
    this.signSubject.next(this.allSignRequests);
    this.updateIcon(shouldClose);
  }

  public async authorizeUrl (url: string, request: RequestAuthorizeTab): Promise<boolean> {
    const idStr = this.stripUrl(url);

    if (this.#authUrls[idStr]) {
      assert(this.#authUrls[idStr].isAllowed, `The source ${url} is not allowed to interact with this extension`);

      return true;
    }

    return new Promise((resolve, reject): void => {
      const id = getId();

      this.#authRequests[id] = {
        id,
        idStr,
        request,
        resolve: this.authComplete(id, resolve),
        reject: this.authComplete(id, reject),
        url
      };

      this.updateIconAuth();
      this.popupOpen();
    });
  }

  public ensureUrlAuthorized (url: string): boolean {
    const entry = this.#authUrls[this.stripUrl(url)];

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

  // List all providers the extension is exposing
  public rpcListProviders (): Promise<ResponseRpcListProviders> {
    return Promise.resolve(Object.keys(this.#providers).reduce((acc, key) => {
      acc[key] = this.#providers[key].meta;

      return acc;
    }, {} as ResponseRpcListProviders));
  }

  public rpcSend (request: RequestRpcSend, port: chrome.runtime.Port): Promise<JsonRpcResponse> {
    const provider = this.getProvider(port);
    assert(provider, 'Cannot call pub(rpc.subscribe) before provider has been set');

    return provider.send(request.method, request.params);
  }

  // Start a provider, return its meta
  public rpcStartProvider (key: string, port: chrome.runtime.Port): Promise<ProviderMeta> {
    if (this.getProvider(port)) {
      return Promise.resolve(this.#providers[key].meta);
    }

    assert(Object.keys(this.#providers).includes(key), `Provider ${key} is not exposed by extension`);

    // Instantiate the provider
    this.#injectedProviders.set(port, this.#providers[key].start());

    // Close provider connection when page is closed
    port.onDisconnect.addListener((): void => {
      const provider = this.#injectedProviders.get(port);
      if (provider) {
        provider.disconnect();
      }
      this.#injectedProviders.delete(port);
    });

    return Promise.resolve(this.#providers[key].meta);
  }

  public rpcSubscribe (request: RequestRpcSubscribe, cb: ProviderInterfaceCallback, port: chrome.runtime.Port): Promise<number> {
    const provider = this.getProvider(port);
    assert(provider, 'Cannot call pub(rpc.subscribe) before provider has been set');

    return provider.subscribe(
      request.type,
      request.method,
      request.params,
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore WsProvider gives me (error, result)=>void, whereas (result)=>void is expected
      (_error, res) => { cb(res); }
    );
  }

  public rpcUnsubscribe (request: RequestRpcUnsubscribe, port: chrome.runtime.Port): Promise<boolean> {
    const provider = this.getProvider(port);
    assert(provider, 'Cannot call pub(rpc.unsubscribe) before provider has been set');

    return provider.unsubscribe(request.type, request.method, request.subscriptionId);
  }

  public sign (url: string, request: RequestSign, account: AccountJson): Promise<ResponseSigning> {
    const id = getId();

    return new Promise((resolve, reject): void => {
      this.#signRequests[id] = {
        account,
        id,
        request,
        resolve: this.signComplete(id, resolve),
        reject: this.signComplete(id, reject),
        url
      };

      this.updateIconSign();
      this.popupOpen();
    });
  }
}
