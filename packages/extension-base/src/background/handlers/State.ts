// Copyright 2019-2023 @polkadot/extension-bg authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDef, ProviderMeta } from '@polkadot/extension-inject/types';
import type { JsonRpcResponse, ProviderInterface, ProviderInterfaceCallback } from '@polkadot/rpc-provider/types';
import type { AccountJson, AuthorizeRequest, MetadataRequest, RequestAuthorizeTab, RequestRpcSend, RequestRpcSubscribe, RequestRpcUnsubscribe, RequestSign, ResponseRpcListProviders, ResponseSigning, SigningRequest } from '../types';

import { BehaviorSubject } from 'rxjs';
import { v4 as uuid } from 'uuid';

import settings from '@polkadot/ui-settings';
import { assert } from '@polkadot/util';

import localStorageStores from '../../utils/localStorageStores';
import { NORMAL_CREATE_WINDOW_DATA, POPUP_CREATE_WINDOW_DATA } from './consts';
import { openCenteredWindow, withErrorLog } from './helpers';

interface Resolver<T> {
  reject: (error: Error) => void;
  resolve: (result: T) => void;
}

interface AuthRequest extends Resolver<AuthResponse> {
  id: string;
  idStr: string;
  request: RequestAuthorizeTab;
  url: string;
}

export type AuthUrls = Record<string, AuthUrlInfo>;

export type AuthorizedAccountsDiff = {
  [url: string]: AuthUrlInfo['authorizedAccounts']
}

export interface AuthUrlInfo {
  count: number;
  id: string;
  // this is from pre-0.44.1
  isAllowed?: boolean;
  lastAuth: number;
  origin: string;
  url: string;
  authorizedAccounts: string[];
}

interface MetaRequest extends Resolver<boolean> {
  id: string;
  request: MetadataDef;
  url: string;
}

export interface AuthResponse {
  result: boolean;
  authorizedAccounts: string[];
}

// List of providers passed into constructor. This is the list of providers
// exposed by the extension.
type Providers = Record<string, {
  meta: ProviderMeta;
  // The provider is not running at init, calling this will instantiate the
  // provider.
  start: () => ProviderInterface;
}>

interface SignRequest extends Resolver<ResponseSigning> {
  account: AccountJson;
  id: string;
  request: RequestSign;
  url: string;
}

const NOTIFICATION_URL = chrome.runtime.getURL('notification.html');

export enum NotificationOptions {
  None,
  Normal,
  PopUp,
}

export default class State {
  readonly #authRequests: Record<string, AuthRequest> = {};

  // Map of providers currently injected in tabs
  readonly #injectedProviders = new Map<chrome.runtime.Port, ProviderInterface>();

  readonly #metaRequests: Record<string, MetaRequest> = {};

  #notification = settings.notification;

  // Map of all providers exposed by the extension, they are retrievable by key
  readonly #providers: Providers;

  readonly #signRequests: Record<string, SignRequest> = {};

  #connectedTabsUrl: string[] = [];

  public readonly authSubject: BehaviorSubject<AuthorizeRequest[]> = new BehaviorSubject<AuthorizeRequest[]>([]);

  public readonly metaSubject: BehaviorSubject<MetadataRequest[]> = new BehaviorSubject<MetadataRequest[]>([]);

  public readonly signSubject: BehaviorSubject<SigningRequest[]> = new BehaviorSubject<SigningRequest[]>([]);

  constructor (providers: Providers = {}) {
    this.#providers = providers;
  }

  public async getKnownMetadata (): Promise<MetadataDef[]> {
    return Object.values(await localStorageStores.chainMetadata.get());
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

  public getAuthUrls (): Promise<AuthUrls> {
    return localStorageStores.authUrls.get();
  }

  public async getDefaultAuthAccountSelection (): Promise<string[]> {
    return localStorageStores.defaultAuthAccounts.get();
  }

  private popupOpen (): void {
    if (this.#notification === 'extension') {
      return;
    }

    const createData = this.#notification === 'window'
      ? NORMAL_CREATE_WINDOW_DATA
      : POPUP_CREATE_WINDOW_DATA;

    openCenteredWindow({
      ...createData,
      url: NOTIFICATION_URL
    }).catch(console.error);
  }

  private authComplete = (id: string, resolve: (resValue: AuthResponse) => void, reject: (error: Error) => void): Resolver<AuthResponse> => {
    const clearAuth = () => {
      delete this.#authRequests[id];
      this.updateIconAuth();
    };

    const complete = async (authorizedAccounts: string[] = []) => {
      const { idStr, request: { origin }, url } = this.#authRequests[id];

      const URLorigin = new URL(url).origin;

      await Promise.all([
        localStorageStores.authUrls.update((currentContent) => ({
          ...currentContent,
          [URLorigin]: {
            authorizedAccounts,
            count: 0,
            id: idStr,
            lastAuth: Date.now(),
            origin,
            url: URLorigin
          }
        })),
        this.updateDefaultAuthAccounts(authorizedAccounts)
      ]);

      clearAuth();
    };

    return {
      reject: (error: Error): void => {
        clearAuth();
        reject(error);
      },
      resolve: ({ authorizedAccounts, result }: AuthResponse): void => {
        complete(authorizedAccounts).finally(() => resolve({ authorizedAccounts, result }));
      }
    };
  };

  public async updateCurrentTabsUrl (urls: string[]) {
    const authUrls = await this.getAuthUrls();

    const connectedTabs = urls.map((url) => {
      let strippedUrl = '';

      // the assert in stripUrl may throw for new tabs with "chrome://newtab/"
      try {
        strippedUrl = new URL(url).origin;
      } catch (e) {
        console.error(e);
      }

      // return the stripped url only if this website is known
      return !!strippedUrl && authUrls[strippedUrl]
        ? strippedUrl
        : undefined;
    })
      .filter((value) => !!value) as string[];

    this.#connectedTabsUrl = connectedTabs;
  }

  public getConnectedTabsUrl () {
    return this.#connectedTabsUrl;
  }

  public deleteAuthRequest (requestId: string) {
    delete this.#authRequests[requestId];
    this.updateIconAuth();
  }

  public async updateDefaultAuthAccounts (newList: string[]) {
    await localStorageStores.defaultAuthAccounts.set(newList);
  }

  private metaComplete = (id: string, resolve: (result: boolean) => void, reject: (error: Error) => void): Resolver<boolean> => {
    const complete = (): void => {
      delete this.#metaRequests[id];
      this.updateIconMeta();
    };

    return {
      reject: (error: Error): void => {
        complete();
        reject(error);
      },
      resolve: (result: boolean): void => {
        complete();
        resolve(result);
      }
    };
  };

  private signComplete = (id: string, resolve: (result: ResponseSigning) => void, reject: (error: Error) => void): Resolver<ResponseSigning> => {
    const complete = (): void => {
      delete this.#signRequests[id];
      this.updateIconSign();
    };

    return {
      reject: (error: Error): void => {
        complete();
        reject(error);
      },
      resolve: (result: ResponseSigning): void => {
        complete();
        resolve(result);
      }
    };
  };

  private updateIcon (): void {
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

    withErrorLog(() => chrome.action.setBadgeText({ text }));
  }

  public removeAuthorization (url: string): Promise<AuthUrls> {
    return localStorageStores.authUrls.update(({ [url]: entryToRemove, ...otherAuthUrls }) => {
      assert(entryToRemove, `The source ${url} is not known`);

      return otherAuthUrls;
    });
  }

  private updateIconAuth (): void {
    this.authSubject.next(this.allAuthRequests);
    this.updateIcon();
  }

  private updateIconMeta (): void {
    this.metaSubject.next(this.allMetaRequests);
    this.updateIcon();
  }

  private updateIconSign (): void {
    this.signSubject.next(this.allSignRequests);
    this.updateIcon();
  }

  public async updateAuthorizedAccounts (authorizedAccountDiff: AuthorizedAccountsDiff): Promise<void> {
    await localStorageStores.authUrls.update((currentContent) => {
      const updatedAuthUrls = Object.fromEntries(Object.entries(authorizedAccountDiff).map(([url, newAuthorizedAccounts]) => {
        const origin = new URL(url).origin;

        return [
          origin,
          {
            ...currentContent[origin],
            authorizedAccounts: newAuthorizedAccounts,
            lastAuth: Date.now()
          }
        ];
      }));

      return {
        ...currentContent,
        ...updatedAuthUrls
      };
    });
  }

  public async updateAuthorizedDate (url: string): Promise<void> {
    const { origin } = new URL(url);

    await localStorageStores.authUrls.update((currentContent) => ({
      ...currentContent,
      [origin]: {
        ...currentContent[origin],
        lastAuth: Date.now()
      }
    }));
  }

  public async authorizeUrl (url: string, request: RequestAuthorizeTab): Promise<AuthResponse> {
    const idStr = new URL(url).origin;

    // Do not enqueue duplicate authorization requests.
    const isDuplicate = Object
      .values(this.#authRequests)
      .some((request) => request.idStr === idStr);

    assert(!isDuplicate, `The source ${url} has a pending authorization request`);

    const authUrls = await this.getAuthUrls();

    if (authUrls[idStr]) {
      assert(authUrls[idStr].authorizedAccounts || authUrls[idStr].isAllowed, `The source ${url} is not allowed to interact with this extension`);

      return {
        authorizedAccounts: [],
        result: false
      };
    }

    return new Promise((resolve, reject): void => {
      const id = uuid();

      this.#authRequests[id] = {
        ...this.authComplete(id, resolve, reject),
        id,
        idStr,
        request,
        url
      };

      this.updateIconAuth();
      this.popupOpen();
    });
  }

  public async ensureUrlAuthorized (url: string): Promise<boolean> {
    const entry = (await this.getAuthUrls())[new URL(url).origin];

    assert(entry, `The source ${url} has not been enabled yet`);

    return true;
  }

  public injectMetadata (url: string, request: MetadataDef): Promise<boolean> {
    return new Promise((resolve, reject): void => {
      const id = uuid();

      this.#metaRequests[id] = {
        ...this.metaComplete(id, resolve, reject),
        id,
        request,
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

  // List all providers the extension is exposing
  public rpcListProviders (): Promise<ResponseRpcListProviders> {
    return Promise.resolve(Object.keys(this.#providers).reduce((acc, key) => {
      acc[key] = this.#providers[key].meta;

      return acc;
    }, {} as ResponseRpcListProviders));
  }

  public rpcSend (request: RequestRpcSend, port: chrome.runtime.Port): Promise<JsonRpcResponse> {
    const provider = this.#injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.subscribe) before provider is set');

    return provider.send(request.method, request.params);
  }

  // Start a provider, return its meta
  public rpcStartProvider (key: string, port: chrome.runtime.Port): Promise<ProviderMeta> {
    assert(Object.keys(this.#providers).includes(key), `Provider ${key} is not exposed by extension`);

    if (this.#injectedProviders.get(port)) {
      return Promise.resolve(this.#providers[key].meta);
    }

    // Instantiate the provider
    this.#injectedProviders.set(port, this.#providers[key].start());

    // Close provider connection when page is closed
    port.onDisconnect.addListener((): void => {
      const provider = this.#injectedProviders.get(port);

      if (provider) {
        withErrorLog(() => provider.disconnect());
      }

      this.#injectedProviders.delete(port);
    });

    return Promise.resolve(this.#providers[key].meta);
  }

  public rpcSubscribe ({ method, params, type }: RequestRpcSubscribe, cb: ProviderInterfaceCallback, port: chrome.runtime.Port): Promise<number | string> {
    const provider = this.#injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.subscribe) before provider is set');

    return provider.subscribe(type, method, params, cb);
  }

  public rpcSubscribeConnected (_request: null, cb: ProviderInterfaceCallback, port: chrome.runtime.Port): void {
    const provider = this.#injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.subscribeConnected) before provider is set');

    cb(null, provider.isConnected); // Immediately send back current isConnected
    provider.on('connected', () => cb(null, true));
    provider.on('disconnected', () => cb(null, false));
  }

  public rpcUnsubscribe (request: RequestRpcUnsubscribe, port: chrome.runtime.Port): Promise<boolean> {
    const provider = this.#injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.unsubscribe) before provider is set');

    return provider.unsubscribe(request.type, request.method, request.subscriptionId);
  }

  public async saveMetadata ({ types, ...restMeta }: MetadataDef): Promise<void> {
    type TypesType = ReturnType<Parameters<typeof localStorageStores.chainMetadata.update>[0]>[string]['types']

    await localStorageStores.chainMetadata.update((currentContent) => ({
      ...currentContent,
      [restMeta.genesisHash]: {
        ...restMeta,
        // Type assertion, because "MetadataDef.types" can contain the CodecClass which should not appear here (and is not serializable anyway, so no use of it in local storage)
        types: types as TypesType
      }
    }));
  }

  public setNotification (notification: string): boolean {
    this.#notification = notification;

    return true;
  }

  public sign (url: string, request: RequestSign, account: AccountJson): Promise<ResponseSigning> {
    const id = uuid();

    return new Promise((resolve, reject): void => {
      this.#signRequests[id] = {
        ...this.signComplete(id, resolve, reject),
        account,
        id,
        request,
        url
      };

      this.updateIconSign();
      this.popupOpen();
    });
  }
}
