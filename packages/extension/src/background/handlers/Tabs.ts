// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { RequestAuthorizeTab, RequestExtrinsicSign, ResponseExtrinsicSign, RequestTypes, ResponseTypes, MessageTypes } from '../types';

import keyring from '@polkadot/ui-keyring';
import accountsObservable from '@polkadot/ui-keyring/observable/accounts';
import { assert } from '@polkadot/util';

import State from './State';
import { createSubscription, unsubscribe } from './subscriptions';

export interface Account {
  address: string;
  name?: string;
}
export type Accounts = Account[];

function transformAccounts (accounts: SubjectInfo): Accounts {
  return Object.values(accounts).map(({ json: { address, meta: { name } } }): Account => ({
    address, name
  }));
}

export default class Tabs {
  private state: State;

  public constructor (state: State) {
    this.state = state;
  }

  private authorize (url: string, request: RequestAuthorizeTab): Promise<boolean> {
    return this.state.authorizeUrl(url, request);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private accountsList (url: string): Accounts {
    return transformAccounts(accountsObservable.subject.getValue());
  }

  // FIXME This looks very much like what we have in Extension
  private accountsSubscribe (url: string, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription(id, port);
    const subscription = accountsObservable.subject.subscribe((accounts: SubjectInfo): void =>
      cb(transformAccounts(accounts))
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private extrinsicSign (url: string, request: RequestExtrinsicSign): Promise<ResponseExtrinsicSign> {
    const { address } = request;
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find keypair');

    return this.state.signQueue(url, request, pair.meta.isExternal);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], url: string, port: chrome.runtime.Port): Promise<ResponseTypes[keyof ResponseTypes]> {
    if (type !== 'pub(authorize.tab)') {
      this.state.ensureUrlAuthorized(url);
    }

    switch (type) {
      case 'pub(authorize.tab)':
        return this.authorize(url, request as RequestAuthorizeTab);

      case 'pub(accounts.list)':
        return this.accountsList(url);

      case 'pub(accounts.subscribe)':
        return this.accountsSubscribe(url, id, port);

      case 'pub(extrinsic.sign)':
        return this.extrinsicSign(url, request as RequestExtrinsicSign);

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
