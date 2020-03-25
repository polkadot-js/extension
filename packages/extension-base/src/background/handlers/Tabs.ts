// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { InjectedAccount, MetadataDef, ProviderMeta } from '@polkadot/extension-inject/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { JsonRpcResponse } from '@polkadot/rpc-provider/types';
import { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { RequestAuthorizeTab, ResponseSigning, RequestTypes, ResponseTypes, MessageTypes, ResponseRpcListProviders, RequestRpcSend, RequestRpcSubscribe, RequestRpcUnsubscribe, SubscriptionMessageTypes } from '../types';

import keyring from '@polkadot/ui-keyring';
import accountsObservable from '@polkadot/ui-keyring/observable/accounts';
import { assert } from '@polkadot/util';
import RequestBytesSign from '../RequestBytesSign';
import RequestExtrinsicSign from '../RequestExtrinsicSign';

import State from './State';
import { createSubscription, unsubscribe } from './subscriptions';

function transformAccounts (accounts: SubjectInfo): InjectedAccount[] {
  return Object.values(accounts).map(({ json: { address, meta: { genesisHash, name } } }): InjectedAccount => ({
    address, genesisHash, name
  }));
}

export default class Tabs {
  readonly #state: State;

  constructor (state: State) {
    this.#state = state;
  }

  private authorize (url: string, request: RequestAuthorizeTab): Promise<boolean> {
    return this.#state.authorizeUrl(url, request);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private accountsList (url: string): InjectedAccount[] {
    return transformAccounts(accountsObservable.subject.getValue());
  }

  // FIXME This looks very much like what we have in Extension
  private accountsSubscribe (url: string, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pub(accounts.subscribe)'>(id, port);
    const subscription = accountsObservable.subject.subscribe((accounts: SubjectInfo): void =>
      cb(transformAccounts(accounts))
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

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

  private rpcListProviders (): Promise<ResponseRpcListProviders> {
    return this.#state.rpcListProviders();
  }

  private rpcSend (request: RequestRpcSend, port: chrome.runtime.Port): Promise<JsonRpcResponse> {
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
      this.rpcUnsubscribe({ ...request, subscriptionId }, port);
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

  public async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], url: string, port: chrome.runtime.Port): Promise<ResponseTypes[keyof ResponseTypes]> {
    if (type !== 'pub(authorize.tab)') {
      this.#state.ensureUrlAuthorized(url);
    }

    switch (type) {
      case 'pub(authorize.tab)':
        return this.authorize(url, request as RequestAuthorizeTab);

      case 'pub(accounts.list)':
        return this.accountsList(url);

      case 'pub(accounts.subscribe)':
        return this.accountsSubscribe(url, id, port);

      case 'pub(bytes.sign)':
        return this.bytesSign(url, request as SignerPayloadRaw);

      case 'pub(extrinsic.sign)':
        return this.extrinsicSign(url, request as SignerPayloadJSON);

      case 'pub(metadata.provide)':
        return this.metadataProvide(url, request as MetadataDef);

      case 'pub(rpc.listProviders)':
        return this.rpcListProviders();

      case 'pub(rpc.send)':
        return this.rpcSend(request as RequestRpcSend, port);

      case 'pub(rpc.startProvider)':
        return this.rpcStartProvider(request as string, port);

      case 'pub(rpc.subscribe)':
        return this.rpcSubscribe(request as RequestRpcSubscribe, id, port);

      case 'pub(rpc.subscribeConnected)':
        return this.rpcSubscribeConnected(request as null, id, port);

      case 'pub(rpc.unsubscribe)':
        return this.rpcUnsubscribe(request as RequestRpcUnsubscribe, port);

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
