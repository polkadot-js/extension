// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Unsubcall } from '@polkadot/extension-dapp/types';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { MessageTypes, MessageAuthorize, MessageExtrinsicSign, MessageExtrinsicSign$Response } from '../types';

import keyring from '@polkadot/ui-keyring';
import accountsObservable from '@polkadot/ui-keyring/observable/accounts';
import { assert, isFunction } from '@polkadot/util';

import State from './State';

type Accounts = Array<{ address: string, name?: string }>;

function transformAccounts (accounts: SubjectInfo): Accounts {
  return Object.values(accounts).map(({ json: { address, meta: { name } } }) => ({
    address, name
  }));
}

export default class Tabs {
  private _state: State;

  constructor (state: State) {
    this._state = state;
  }

  private authorize (url: string, request: MessageAuthorize) {
    return this._state.authorizeUrl(url, request);
  }

  private accountsList (url: string): Accounts {
    return transformAccounts(accountsObservable.subject.getValue());
  }

  private accountsSubscribe (url: string, cb?: (accounts: Accounts) => void): Unsubcall {
    if (!isFunction(cb)) {
      throw new Error('Expected accountsSubscribe to be passed a subscriber');
    }

    const subscription = accountsObservable.subject.subscribe((accounts: SubjectInfo) =>
      cb(transformAccounts(accounts))
    );

    return (): void => {
      subscription.unsubscribe();
    };
  }

  private extrinsicSign (url: string, request: MessageExtrinsicSign): Promise<MessageExtrinsicSign$Response> {
    const { address } = request;
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find keypair');

    return this._state.signQueue(url, request);
  }

  async handle (type: MessageTypes, request: any, url: string, subscriber?: (data: any) => void): Promise<any> {
    switch (type) {
      case 'authorize.tab':
        return this.authorize(url, request);

      case 'accounts.list':
        return this.accountsList(url);

      case 'accounts.subscribe':
        return this.accountsSubscribe(url, subscriber);

      case 'extrinsic.sign':
        return this.extrinsicSign(url, request);

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
