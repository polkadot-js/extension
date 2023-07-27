// Copyright 2019-2023 @polkadot/extension-bg authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDef, ProviderMeta } from '@polkadot/extension-inject/types';
import type { JsonRpcResponse, ProviderInterface, ProviderInterfaceCallback } from '@polkadot/rpc-provider/types';
import type { AccountJson, AuthorizeTabRequestPayload, MetadataRequest, RequestPayload, RequestRpcSend, RequestRpcSubscribe, RequestRpcUnsubscribe, ResponseRpcListProviders, SigningRequest } from '../types';

import settings from '@polkadot/ui-settings';
import { assert } from '@polkadot/util';

import localStorageStores from '../../utils/localStorageStores';
import { SignerPayloadJSONWithType, SignerPayloadRawWithType } from '../types';
import { NORMAL_CREATE_WINDOW_DATA, POPUP_CREATE_WINDOW_DATA } from './consts';
import { openCenteredWindow, withErrorLog } from './helpers';

interface AuthRequest {
  id: string;
  requestingTabId: number;
  idStr: string;
  payload: AuthorizeTabRequestPayload;
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
  id: string,
  requestingTabId: number;
  payload: RequestPayload;
  url: string;
}

const NOTIFICATION_URL = chrome.runtime.getURL('notification.html');

export enum NotificationOptions {
  None,
  Normal,
  PopUp,
}

export default class State {
  // Map of providers currently injected in tabs
  readonly #injectedProviders = new Map<chrome.runtime.Port, ProviderInterface>();

  #notification = settings.notification;

  // Map of all providers exposed by the extension, they are retrievable by key
  readonly #providers: Providers;

  #activeTabUrl: string | undefined;

  constructor (providers: Providers = {}) {
    this.#providers = providers;
  }

  public async init (initialParams: { chainMetadataSets: MetadataDef[] }) {
    await this.saveMetadata(initialParams.chainMetadataSets);
  }

  public async getKnownMetadata (): Promise<MetadataDef[]> {
    return Object.values(await localStorageStores.chainMetadata.get());
  }

  public async getAuthRequestsNumber (): Promise<number> {
    return (await localStorageStores.authRequests.get()).length;
  }

  public async getMetadataRequestsNumber (): Promise<number> {
    return (await localStorageStores.metadataRequests.get()).length;
  }

  public async getSignRequestsNumber (): Promise<number> {
    return (await localStorageStores.signRequests.get()).length;
  }

  public getAllSignRequests (): Promise<SigningRequest[]> {
    return localStorageStores.signRequests.get();
  }

  public getAuthUrls (): Promise<AuthUrls> {
    return localStorageStores.authUrls.get();
  }

  public async getDefaultAuthAccountSelection (): Promise<string[]> {
    return localStorageStores.defaultAuthAccounts.get();
  }

  private async openSingletonPopup (): Promise<void> {
    if (this.#notification === 'extension') {
      return;
    }

    const createData = this.#notification === 'window'
      ? NORMAL_CREATE_WINDOW_DATA
      : POPUP_CREATE_WINDOW_DATA;

    const [extensionTabWindow] = await chrome.windows.getAll({
      populate: true,
      windowTypes: [createData.type]
    });
    const [extensionTab] = extensionTabWindow?.tabs?.filter((tab) => tab?.url?.startsWith(NOTIFICATION_URL)) || [];

    // The popup already exists, so let's bring it to focus instead of creating a new one
    if (extensionTabWindow?.id && extensionTab?.id) {
      await chrome.windows.update(extensionTabWindow.id, { focused: true });
      await chrome.tabs.update(extensionTab.id, { active: true });

      return;
    }

    await openCenteredWindow({
      ...createData,
      url: NOTIFICATION_URL
    }).catch(console.error);
  }

  public async addAuthorizedUrl (idStr: string, origin: string, url: string, authorizedAccounts: string[]) {
    const urlOrigin = new URL(url).origin;

    await Promise.all([
      localStorageStores.authUrls.update((currentContent) => ({
        ...currentContent,
        [urlOrigin]: {
          authorizedAccounts,
          count: 0,
          id: idStr,
          lastAuth: Date.now(),
          origin,
          url: urlOrigin
        }
      })),
      this.updateDefaultAuthAccounts(authorizedAccounts)
    ]);
  }

  public updateActiveTabUrl (url: string | undefined) {
    this.#activeTabUrl = url;
  }

  public async getConnectedActiveTabUrl () {
    const authUrls = await this.getAuthUrls();

    if (!this.#activeTabUrl) {
      return undefined;
    }

    try {
      // may throw for new tabs with "chrome://newtab/"
      const rawUrl = new URL(this.#activeTabUrl).origin;

      const isConnected = authUrls[rawUrl];

      return isConnected ? rawUrl : undefined;
    } catch (e) {
      console.error('Error calculating connected active tab url:', e);

      return undefined;
    }
  }

  public async removeAuthRequest (id: string) {
    await localStorageStores.authRequests.update((authRequests) =>
      authRequests.filter((authRequest) => authRequest.id !== id)
    );

    await this.updateIcon();
  }

  public async updateDefaultAuthAccounts (newList: string[]) {
    await localStorageStores.defaultAuthAccounts.set(newList);
  }

  private async updateIcon (): Promise<void> {
    const [
      authCount,
      metaCount,
      signCount
    ] = await Promise.all([
      this.getAuthRequestsNumber(),
      this.getMetadataRequestsNumber(),
      this.getSignRequestsNumber()
    ]);

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

  public async authorizeUrl (url: string, messageId: string, requestingTabId: number, payload: AuthorizeTabRequestPayload, respond: (response: unknown) => void): Promise<void> {
    const idStr = new URL(url).origin;

    // Do not enqueue duplicate authorization requests.
    const isDuplicate = (await localStorageStores.authRequests.get())
      .some((request) => request.idStr === idStr);

    assert(!isDuplicate, `The source ${url} has a pending authorization request`);

    const authUrls = await this.getAuthUrls();

    if (authUrls[idStr]) {
      assert(authUrls[idStr].authorizedAccounts || authUrls[idStr].isAllowed, `The source ${url} is not allowed to interact with this extension`);

      return respond({
        authorizedAccounts: [],
        result: false
      });
    }

    await localStorageStores.authRequests.update((authRequests) => [
      ...authRequests,
      {
        id: messageId,
        requestingTabId,
        idStr,
        payload,
        url
      }
    ]);

    await this.updateIcon();
    await this.openSingletonPopup();
  }

  public async ensureUrlAuthorized (url: string): Promise<boolean> {
    const entry = (await this.getAuthUrls())[new URL(url).origin];

    assert(entry, `The source ${url} has not been enabled yet`);

    return true;
  }

  public async injectMetadata (url: string, { types, ...restPayload }: MetadataDef, messageId: string, requestingTabId: number): Promise<void> {
    type TypesType = ReturnType<Parameters<typeof localStorageStores.chainMetadata.update>[0]>[string]['types']

    await localStorageStores.metadataRequests.update((signRequests) => [
      ...signRequests,
      {
        id: messageId,
        requestingTabId,
        payload: {
          ...restPayload,
          // Type assertion, because "MetadataDef.types" can contain the CodecClass which should not appear here (and is not serializable anyway, so no use of it in local storage)
          types: types as TypesType
        },
        url
      }
    ]);

    await this.updateIcon();
    await this.openSingletonPopup();
  }

  public async getAuthRequest (id: string): Promise<AuthRequest | undefined> {
    return (await localStorageStores.authRequests.get()).find((authRequest) => authRequest.id === id);
  }

  public async getMetaRequest (id: string): Promise<MetadataRequest | undefined> {
    return (await localStorageStores.metadataRequests.get()).find((metadataRequest) => metadataRequest.id === id);
  }

  public async getSignRequest (id: string): Promise<SignRequest | undefined> {
    return (await localStorageStores.signRequests.get()).find((signRequest) => signRequest.id === id);
  }

  public async removeSignRequest (id: string): Promise<void> {
    await localStorageStores.signRequests.update((signRequests) =>
      signRequests.filter((signRequest) => signRequest.id !== id)
    );

    await this.updateIcon();
  }

  public async removeMetadataRequest (id: string): Promise<void> {
    await localStorageStores.metadataRequests.update((metadataRequests) =>
      metadataRequests.filter((metadataRequest) => metadataRequest.id !== id)
    );

    await this.updateIcon();
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

  public async saveMetadata (chainMetadataSets: MetadataDef[]): Promise<void> {
    type TypesType = ReturnType<Parameters<typeof localStorageStores.chainMetadata.update>[0]>[string]['types']

    await localStorageStores.chainMetadata.update((currentContent) => ({
      ...currentContent,
      ...Object.fromEntries(chainMetadataSets.map(({ types, ...restMeta }) => [
        restMeta.genesisHash,
        {
          ...restMeta,
          // Type assertion, because "MetadataDef.types" can contain the CodecClass which should not appear here (and is not serializable anyway, so no use of it in local storage)
          types: types as TypesType
        }
      ]))
    }));
  }

  public setNotification (notification: string): boolean {
    this.#notification = notification;

    return true;
  }

  public async invokeSignatureRequest (
    url: string,
    payload: SignerPayloadRawWithType | SignerPayloadJSONWithType,
    account: AccountJson,
    messageId: string,
    requestingTabId: number
  ): Promise<void> {
    await localStorageStores.signRequests.update((signRequests) => [
      ...signRequests,
      {
        account,
        id: messageId,
        requestingTabId,
        payload,
        url
      }
    ]);

    await this.updateIcon();
    await this.openSingletonPopup();
  }
}
