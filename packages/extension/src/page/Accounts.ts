// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { InjectedAccounts, InjectedAccount, Unsubcall } from '@polkadot/extension-dapp/types';
import { SendRequest } from './types';

let sendRequest: SendRequest;

export default class Accounts implements InjectedAccounts {
  constructor (_sendRequest: SendRequest) {
    sendRequest = _sendRequest;
  }

  get (): Promise<Array<InjectedAccount>> {
    return sendRequest('accounts.list');
  }

  subscribe (cb: (accounts: Array<InjectedAccount>) => any): Unsubcall {
    // TODO Make an actual subscription, not just the at-now data
    sendRequest('accounts.list')
      .then((accounts: Array<InjectedAccount>) => cb(accounts))
      .catch(console.error);

    return () => {
      // noop, we are not really subscribing (yet)
    };
  }
}
