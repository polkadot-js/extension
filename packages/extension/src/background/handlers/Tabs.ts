// Copyright 2019 @polkadot/extension-bg authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageTypes, MessageAuthorize, MessageExtrinsicSign, MessageExtrinsicSign$Response } from '../types';

import keyring from '@polkadot/ui-keyring';
import accountsObservable from '@polkadot/ui-keyring/observable/accounts';
import { assert } from '@polkadot/util';

import State from './State';

export default class Tabs {
  private _state: State;

  constructor (state: State) {
    this._state = state;
  }

  private authorize (url: string, request: MessageAuthorize) {
    return this._state.authorizeUrl(url, request);
  }

  private accountsList (url: string): Array<{ address: string, name?: string }> {
    return Object
      .values(accountsObservable.subject.getValue())
      .map(({ json: { address, meta: { name } } }) => ({
        address, name
      }));
  }

  private extrinsicSign (url: string, request: MessageExtrinsicSign): Promise<MessageExtrinsicSign$Response> {
    const { address } = request;
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find keypair');

    return this._state.signQueue(url, request);
  }

  async handle (type: MessageTypes, request: any, url: string = 'unknown'): Promise<any> {
    switch (type) {
      case 'authorize.tab':
        return this.authorize(url, request);

      case 'accounts.list':
        return this.accountsList(url);

      case 'extrinsic.sign':
        return this.extrinsicSign(url, request);

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
