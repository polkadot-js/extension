// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { MessageTypes, MessageAuthorize, MessageExtrinsicSign, MessageExtrinsicSignResponse } from '../types';

import keyring from '@polkadot/ui-keyring';
import accountsObservable from '@polkadot/ui-keyring/observable/accounts';
import { assert } from '@polkadot/util';

import State from './State';
import { createSubscription, unsubscribe } from './subscriptions';

interface Account {
  address: string;
  name?: string;
}
type Accounts = Account[];

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

  private authorize (url: string, request: MessageAuthorize): Promise<boolean> {
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

  private extrinsicSign (url: string, request: MessageExtrinsicSign): Promise<MessageExtrinsicSignResponse> {
    const { address } = request;
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find keypair');

    return this.state.signQueue(url, request, pair.meta.isExternal);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async handle (id: string, type: MessageTypes, request: any, url: string, port: chrome.runtime.Port): Promise<any> {
    if (type !== 'authorize.tab') {
      this.state.ensureUrlAuthorized(url);
    }

    switch (type) {
      case 'authorize.tab':
        return this.authorize(url, request);

      case 'accounts.list':
        return this.accountsList(url);

      case 'accounts.subscribe':
        return this.accountsSubscribe(url, id, port);

      case 'extrinsic.sign':
        return this.extrinsicSign(url, request);

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
