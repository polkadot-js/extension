// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Subscription } from 'rxjs';
import type { InjectedAccount, InjectedMetadataKnown, MetadataDef, ProviderMeta } from '@polkadot/extension-inject/types';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { JsonRpcResponse } from '@polkadot/rpc-provider/types';
import type { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import type { AuthorizeTabRequestPayload, MessageTypes, RequestAccountList, RequestAccountUnsubscribe, RequestRpcSend, RequestRpcSubscribe, RequestRpcUnsubscribe, RequestTypes, ResponseRpcListProviders, SignerPayloadJSONWithType, SignerPayloadRawWithType, SubscriptionMessageTypes } from '../types';

import { PHISHING_PAGE_REDIRECT } from '@polkadot/extension-base/defaults';
import { canDerive } from '@polkadot/extension-base/utils';
import { checkIfDenied } from '@polkadot/phishing';
import keyring from '@polkadot/ui-keyring';
import { accounts as accountsObservable } from '@polkadot/ui-keyring/observable/accounts';
import { assert, isNumber } from '@polkadot/util';

import { withErrorLog } from './helpers';
import State from './State';
import { createSubscription, unsubscribe } from './subscriptions';

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

  private async filterForAuthorizedAccounts (accounts: InjectedAccount[], url: string): Promise<InjectedAccount[]> {
    const auth = (await this.#state.getAuthUrls())[new URL(url).origin];

    return accounts.filter(
      (allAcc) =>
        auth.authorizedAccounts
          // we have a list, use it
          ? auth.authorizedAccounts.includes(allAcc.address)
          // if no authorizedAccounts and isAllowed return all - these are old converted urls
          : auth.isAllowed
    );
  }

  private async authorize (url: string, messageId: string, requestingTabId: number, request: AuthorizeTabRequestPayload, respondImmediately: (response: unknown) => void): Promise<void> {
    await this.#state.authorizeUrl(url, messageId, requestingTabId, request, respondImmediately);
  }

  private accountsListAuthorized (url: string, { anyType }: RequestAccountList): Promise<InjectedAccount[]> {
    const transformedAccounts = transformAccounts(accountsObservable.subject.getValue(), anyType);

    return this.filterForAuthorizedAccounts(transformedAccounts, url);
  }

  private accountsSubscribeAuthorized (url: string, id: string, getCurrentPort: () => chrome.runtime.Port): string {
    const cb = createSubscription<'pub(accounts.subscribe)'>(id, getCurrentPort);

    this.#accountSubs[id] = {
      subscription: accountsObservable.subject.subscribe((accounts: SubjectInfo): void => {
        const transformedAccounts = transformAccounts(accounts);

        this.filterForAuthorizedAccounts(transformedAccounts, url).then(cb).catch((e) => {
          console.error('Error filtering for authorized accounts:', e);

          cb([]); // eslint-disable-line n/no-callback-literal
        });
      }),
      url
    };

    getCurrentPort().onDisconnect.addListener((): void => {
      try {
        // Test if the closed port hasn't been replaced with a new one - if no, postMessage fails, and we can unsubscribe
        getCurrentPort().postMessage({});
      } catch (e) {
        this.accountsUnsubscribe(url, { id });
      }
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

  private async bytesSign (url: string, messageId: string, requestingTabId: number, payload: SignerPayloadRawWithType): Promise<void> {
    const address = payload.address;
    const pair = this.getSigningPair(address);

    await this.#state.invokeSignatureRequest(url, payload, { address, ...pair.meta }, messageId, requestingTabId);
  }

  private async extrinsicSign (url: string, messageId: string, requestingTabId: number, payload: SignerPayloadJSONWithType): Promise<void> {
    const address = payload.address;
    const pair = this.getSigningPair(address);

    await this.#state.invokeSignatureRequest(url, payload, { address, ...pair.meta }, messageId, requestingTabId);
  }

  private async metadataProvide (url: string, messageId: string, requestingTabId: number, payload: MetadataDef): Promise<void> {
    await this.#state.injectMetadata(url, payload, messageId, requestingTabId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async metadataList (url: string): Promise<InjectedMetadataKnown[]> {
    return (await this.#state.getKnownMetadata()).map(({ genesisHash, specVersion }) => ({
      genesisHash,
      specVersion
    }));
  }

  private rpcListProviders (): Promise<ResponseRpcListProviders> {
    return this.#state.rpcListProviders();
  }

  private rpcSend (request: RequestRpcSend, getCurrentPort: () => chrome.runtime.Port): Promise<JsonRpcResponse> {
    return this.#state.rpcSend(request, getCurrentPort());
  }

  private rpcStartProvider (key: string, getCurrentPort: () => chrome.runtime.Port): Promise<ProviderMeta> {
    return this.#state.rpcStartProvider(key, getCurrentPort());
  }

  private async rpcSubscribe (request: RequestRpcSubscribe, id: string, getCurrentPort: () => chrome.runtime.Port): Promise<boolean> {
    const innerCb = createSubscription<'pub(rpc.subscribe)'>(id, getCurrentPort);
    const cb = (_error: Error | null, data: SubscriptionMessageTypes['pub(rpc.subscribe)']): void => innerCb(data);
    const subscriptionId = await this.#state.rpcSubscribe(request, cb, getCurrentPort());

    getCurrentPort().onDisconnect.addListener((): void => {
      try {
        // Test if the closed port hasn't been replaced with a new one - if no, postMessage fails, and we can unsubscribe
        getCurrentPort().postMessage({});
      } catch (e) {
        unsubscribe(id);
        withErrorLog(() => this.rpcUnsubscribe({ ...request, subscriptionId }, getCurrentPort));
      }
    });

    return true;
  }

  private rpcSubscribeConnected (request: null, id: string, getCurrentPort: () => chrome.runtime.Port): Promise<boolean> {
    const innerCb = createSubscription<'pub(rpc.subscribeConnected)'>(id, getCurrentPort);
    const cb = (_error: Error | null, data: SubscriptionMessageTypes['pub(rpc.subscribeConnected)']): void => innerCb(data);

    this.#state.rpcSubscribeConnected(request, cb, getCurrentPort());

    getCurrentPort().onDisconnect.addListener((): void => {
      try {
        // Test if the closed port hasn't been replaced with a new one - if no, postMessage fails, and we can unsubscribe
        getCurrentPort().postMessage({});
      } catch (e) {
        unsubscribe(id);
      }
    });

    return Promise.resolve(true);
  }

  private async rpcUnsubscribe (request: RequestRpcUnsubscribe, getCurrentPort: () => chrome.runtime.Port): Promise<boolean> {
    return this.#state.rpcUnsubscribe(request, getCurrentPort());
  }

  private redirectPhishingLanding (phishingWebsite: string): void {
    const nonFragment = phishingWebsite.split('#')[0];
    const encodedWebsite = encodeURIComponent(nonFragment);
    const url = `${chrome.runtime.getURL('external.html')}#${PHISHING_PAGE_REDIRECT}/${encodedWebsite}`;

    chrome.tabs.query({ url: nonFragment }, (tabs) => {
      tabs
        .map(({ id }) => id)
        .filter((id): id is number => isNumber(id))
        .forEach((id) =>
          withErrorLog(() => chrome.tabs.update(id, { url }))
        );
    });
  }

  private async redirectIfPhishing (url: string): Promise<boolean> {
    const isInDenyList = await checkIfDenied(url);

    if (isInDenyList) {
      this.redirectPhishingLanding(url);

      return true;
    }

    return false;
  }

  public async handle<TMessageType extends MessageTypes> (
    messageId: string,
    type: TMessageType,
    request: RequestTypes[TMessageType],
    respondImmediately: (response: unknown) => void,
    url: string,
    getCurrentPort: () => chrome.runtime.Port
  ): Promise<unknown> {
    if (type === 'pub(phishing.redirectIfDenied)') {
      return this.redirectIfPhishing(url).then(respondImmediately);
    }

    if (type !== 'pub(authorize.tab)') {
      await this.#state.ensureUrlAuthorized(url);
    }

    switch (type) {
      case 'pub(authorize.tab)':
        return this.authorize(url, messageId, ensureTabId(getCurrentPort().sender?.tab?.id), request as AuthorizeTabRequestPayload, respondImmediately);

      case 'pub(accounts.list)':
        return this.accountsListAuthorized(url, request as RequestAccountList).then(respondImmediately);

      case 'pub(accounts.subscribe)':
        return respondImmediately(this.accountsSubscribeAuthorized(url, messageId, getCurrentPort));

      case 'pub(accounts.unsubscribe)':
        return respondImmediately(this.accountsUnsubscribe(url, request as RequestAccountUnsubscribe));

      case 'pub(bytes.sign)':
        return this.bytesSign(url, messageId, ensureTabId(getCurrentPort().sender?.tab?.id), request as SignerPayloadRawWithType);

      case 'pub(extrinsic.sign)':
        return this.extrinsicSign(url, messageId, ensureTabId(getCurrentPort().sender?.tab?.id), request as SignerPayloadJSONWithType);

      case 'pub(metadata.list)':
        return this.metadataList(url).then(respondImmediately);

      case 'pub(metadata.provide)':
        return this.metadataProvide(url, messageId, ensureTabId(getCurrentPort().sender?.tab?.id), request as MetadataDef);

      case 'pub(rpc.listProviders)':
        return this.rpcListProviders().then(respondImmediately);

      case 'pub(rpc.send)':
        return this.rpcSend(request as RequestRpcSend, getCurrentPort).then(respondImmediately);

      case 'pub(rpc.startProvider)':
        return this.rpcStartProvider(request as string, getCurrentPort).then(respondImmediately);

      case 'pub(rpc.subscribe)':
        return this.rpcSubscribe(request as RequestRpcSubscribe, messageId, getCurrentPort).then(respondImmediately);

      case 'pub(rpc.subscribeConnected)':
        return this.rpcSubscribeConnected(request as null, messageId, getCurrentPort).then(respondImmediately);

      case 'pub(rpc.unsubscribe)':
        return this.rpcUnsubscribe(request as RequestRpcUnsubscribe, getCurrentPort).then(respondImmediately);

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

const ensureTabId = (possibleTabId: number | undefined) => {
  assert(possibleTabId, 'Sender tab id not available');

  return possibleTabId;
};
