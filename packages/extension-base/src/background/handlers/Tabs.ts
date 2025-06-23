// Copyright 2019-2025 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* global chrome */

import type { InjectedAccount, InjectedMetadataKnown, MetadataDef, ProviderMeta } from '@polkadot/extension-inject/types';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { JsonRpcResponse } from '@polkadot/rpc-provider/types';
import type { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import type { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import type { AuthUrlInfo, MessageTypes, RequestAccountList, RequestAccountUnsubscribe, RequestAuthorizeTab, RequestRpcSend, RequestRpcSubscribe, RequestRpcUnsubscribe, RequestTypes, ResponseRpcListProviders, ResponseSigning, ResponseTypes, SubscriptionMessageTypes } from '../types.js';
import type { AuthResponse } from './State.js';
import type State from './State.js';

import { combineLatest, type Subscription } from 'rxjs';
import { parse } from 'tldts';

import { checkIfDenied } from '@polkadot/phishing';
import { keyring } from '@polkadot/ui-keyring';
import { accounts as accountsObservable } from '@polkadot/ui-keyring/observable/accounts';
import { assert, isNumber } from '@polkadot/util';

import { PHISHING_PAGE_REDIRECT } from '../../defaults.js';
import { canDerive } from '../../utils/index.js';
import RequestBytesSign from '../RequestBytesSign.js';
import RequestExtrinsicSign from '../RequestExtrinsicSign.js';
import { withErrorLog } from './helpers.js';
import { createSubscription, unsubscribe } from './subscriptions.js';

interface AccountSub {
  subscription: Subscription;
  url: string;
}

function transformAccounts (accounts: SubjectInfo, anyType = false): InjectedAccount[] {
  return Object
    .values(accounts)
    .filter(({ json: { meta: { isHidden } } }) => !isHidden)
    .filter(({ type }) => anyType ? true : canDerive(type))
    .sort((a, b) => (a.json.meta.whenCreated || 0) - (b.json.meta.whenCreated || 0))
    .map(({ json: { address, meta: { genesisHash, name } }, type }): InjectedAccount => ({
      address,
      genesisHash,
      name,
      type
    }));
}

export default class Tabs {
  readonly #accountSubs: Record<string, AccountSub> = {};

  readonly #state: State;

  constructor (state: State) {
    this.#state = state;
  }

  private filterForAuthorizedAccounts (accounts: InjectedAccount[], url: string): InjectedAccount[] {
    const auth = this.#state.authUrls[this.#state.stripUrl(url)];

    if (!auth) {
      return [];
    }

    return accounts.filter(
      (allAcc) =>
        auth.authorizedAccounts
          // we have a list, use it
          ? auth.authorizedAccounts.includes(allAcc.address)
          // if no authorizedAccounts and isAllowed return all - these are old converted urls
          : auth.isAllowed
    );
  }

  private authorize (url: string, request: RequestAuthorizeTab): Promise<AuthResponse> {
    return this.#state.authorizeUrl(url, request);
  }

  private accountsListAuthorized (url: string, { anyType }: RequestAccountList): InjectedAccount[] {
    const transformedAccounts = transformAccounts(accountsObservable.subject.getValue(), anyType);

    return this.filterForAuthorizedAccounts(transformedAccounts, url);
  }

  private accountsSubscribeAuthorized (url: string, id: string, port: chrome.runtime.Port): string {
    const cb = createSubscription<'pub(accounts.subscribe)'>(id, port);

    const strippedUrl = this.#state.stripUrl(url);

    const authUrlObservable = this.#state.authUrlSubjects[strippedUrl]?.asObservable();

    if (!authUrlObservable) {
      console.error(`No authUrlSubject found for ${strippedUrl}`);

      return id;
    }

    this.#accountSubs[id] = {
      subscription: combineLatest([accountsObservable.subject, authUrlObservable]).subscribe(([accounts, _authUrlInfo]: [SubjectInfo, AuthUrlInfo]): void => {
        const transformedAccounts = transformAccounts(accounts);

        cb(this.filterForAuthorizedAccounts(transformedAccounts, url));
      }),
      url
    };

    port.onDisconnect.addListener((): void => {
      this.accountsUnsubscribe(url, { id });
    });

    return id;
  }

  private accountsUnsubscribe (url: string, { id }: RequestAccountUnsubscribe): boolean {
    const sub = this.#accountSubs[id];

    if (!sub || sub.url !== url) {
      return false;
    }

    delete this.#accountSubs[id];

    unsubscribe(id);
    sub.subscription.unsubscribe();

    return true;
  }

  private getSigningPair (address: string): KeyringPair {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find keypair');

    return pair;
  }

  private bytesSign (url: string, request: SignerPayloadRaw): Promise<ResponseSigning> {
    const address = request.address;
    const pair = this.getSigningPair(address);

    return this.#state.sign(url, new RequestBytesSign(request), { address, ...pair.meta });
  }

  private extrinsicSign (url: string, request: SignerPayloadJSON): Promise<ResponseSigning> {
    const address = request.address;
    const pair = this.getSigningPair(address);

    return this.#state.sign(url, new RequestExtrinsicSign(request), { address, ...pair.meta });
  }

  private metadataProvide (url: string, request: MetadataDef): Promise<boolean> {
    return this.#state.injectMetadata(url, request);
  }

  private metadataList (_url: string): InjectedMetadataKnown[] {
    return this.#state.knownMetadata.map(({ genesisHash, specVersion }) => ({
      genesisHash,
      specVersion
    }));
  }

  private rpcListProviders (): Promise<ResponseRpcListProviders> {
    return this.#state.rpcListProviders();
  }

  private rpcSend (request: RequestRpcSend, port: chrome.runtime.Port): Promise<JsonRpcResponse<unknown>> {
    return this.#state.rpcSend(request, port);
  }

  private rpcStartProvider (key: string, port: chrome.runtime.Port): Promise<ProviderMeta> {
    return this.#state.rpcStartProvider(key, port);
  }

  private async rpcSubscribe (request: RequestRpcSubscribe, id: string, port: chrome.runtime.Port): Promise<boolean> {
    const innerCb = createSubscription<'pub(rpc.subscribe)'>(id, port);
    const cb = (_error: Error | null, data: SubscriptionMessageTypes['pub(rpc.subscribe)']): void => innerCb(data);
    const subscriptionId = await this.#state.rpcSubscribe(request, cb, port);

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      withErrorLog(() => this.rpcUnsubscribe({ ...request, subscriptionId }, port));
    });

    return true;
  }

  private rpcSubscribeConnected (request: null, id: string, port: chrome.runtime.Port): Promise<boolean> {
    const innerCb = createSubscription<'pub(rpc.subscribeConnected)'>(id, port);
    const cb = (_error: Error | null, data: SubscriptionMessageTypes['pub(rpc.subscribeConnected)']): void => innerCb(data);

    this.#state.rpcSubscribeConnected(request, cb, port);

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

    return Promise.resolve(true);
  }

  private async rpcUnsubscribe (request: RequestRpcUnsubscribe, port: chrome.runtime.Port): Promise<boolean> {
    return this.#state.rpcUnsubscribe(request, port);
  }

  private redirectPhishingLanding (phishingWebsite: string): void {
    const nonFragment = phishingWebsite.split('#')[0];
    const encodedWebsite = encodeURIComponent(nonFragment);
    const url = `${chrome.runtime.getURL('index.html')}#${PHISHING_PAGE_REDIRECT}/${encodedWebsite}`;

    chrome.tabs.query({ url: nonFragment }, (tabs) => {
      tabs
        .map(({ id }) => id)
        .filter((id): id is number => isNumber(id))
        .forEach((id) =>
          withErrorLog(() => chrome.tabs.update(id, { url }))
        );
    });
  }

  private parseUrl (rawUrl: string): string {
    let from = 'extension';

    if (rawUrl) {
      try {
        const { hostname } = parse(rawUrl);

        from = hostname || '<unknown>'; // Only use the hostname
      } catch {
        from = '<unknown>';
      }
    }

    return from;
  }

  private async redirectIfPhishing (url: string): Promise<boolean> {
    const isInDenyList = await checkIfDenied(url);

    if (isInDenyList) {
      this.redirectPhishingLanding(url);

      return true;
    }

    return false;
  }

  public async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], url: string, port?: chrome.runtime.Port): Promise<ResponseTypes[keyof ResponseTypes]> {
    if (type === 'pub(phishing.redirectIfDenied)') {
      const parsedUrl = this.parseUrl(url);

      return this.redirectIfPhishing(parsedUrl);
    }

    if (type !== 'pub(authorize.tab)') {
      this.#state.ensureUrlAuthorized(url);
    }

    switch (type) {
      case 'pub(authorize.tab)':
        return this.authorize(url, request as RequestAuthorizeTab);

      case 'pub(accounts.list)':
        return this.accountsListAuthorized(url, request as RequestAccountList);

      case 'pub(accounts.subscribe)':
        return port && this.accountsSubscribeAuthorized(url, id, port);

      case 'pub(accounts.unsubscribe)':
        return this.accountsUnsubscribe(url, request as RequestAccountUnsubscribe);

      case 'pub(bytes.sign)':
        return this.bytesSign(url, request as SignerPayloadRaw);

      case 'pub(extrinsic.sign)':
        return this.extrinsicSign(url, request as SignerPayloadJSON);

      case 'pub(metadata.list)':
        return this.metadataList(url);

      case 'pub(metadata.provide)':
        return this.metadataProvide(url, request as MetadataDef);

      case 'pub(ping)':
        return Promise.resolve(true);

      case 'pub(rpc.listProviders)':
        return this.rpcListProviders();

      case 'pub(rpc.send)':
        return port && this.rpcSend(request as RequestRpcSend, port);

      case 'pub(rpc.startProvider)':
        return port && this.rpcStartProvider(request as string, port);

      case 'pub(rpc.subscribe)':
        return port && this.rpcSubscribe(request as RequestRpcSubscribe, id, port);

      case 'pub(rpc.subscribeConnected)':
        return port && this.rpcSubscribeConnected(request as null, id, port);

      case 'pub(rpc.unsubscribe)':
        return port && this.rpcUnsubscribe(request as RequestRpcUnsubscribe, port);

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
