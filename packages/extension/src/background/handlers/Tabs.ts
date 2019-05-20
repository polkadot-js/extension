// Copyright 2019 @polkadot/extension-bg authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageTypes, MessageExtrinsicSign, MessageExtrinsicSign$Response } from '../types';

import keyring from '@polkadot/ui-keyring';
import accountsObservable from '@polkadot/ui-keyring/observable/accounts';
import { assert } from '@polkadot/util';

import SigningRequests from './SigningRequests';

let signCounter = 0;

export default class Tabs {
  private signing: SigningRequests;

  constructor (signing: SigningRequests) {
    this.signing = signing;
  }

  private accountsList (): Array<{ address: string, name?: string }> {
    return Object
      .values(accountsObservable.subject.getValue())
      .map(({ json: { address, meta: { name } } }) => ({
        address, name
      }));
  }

  private extrinsicSign (request: MessageExtrinsicSign, url: string): Promise<MessageExtrinsicSign$Response> {
    const { address } = request;
    const id = ++signCounter;
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find keypair');

    return this.signing.queue(id, request, url);
  }

  async handle (type: MessageTypes, request: any, url: string = 'unknown'): Promise<any> {
    switch (type) {
      case 'accounts.list':
        return this.accountsList();

      case 'extrinsic.sign':
        return this.extrinsicSign(request, url);

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
