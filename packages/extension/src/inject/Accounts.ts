// Copyright 2019 @polkadot/extension-inject authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Accounts as IAccounts, Account as IAccount, SendRequest } from './types';

let sendRequest: SendRequest;

export default class Accounts implements IAccounts {
  constructor (_sendRequest: SendRequest) {
    sendRequest = _sendRequest;
  }

  get (): Promise<Array<IAccount>> {
    return sendRequest('accounts.list');
  }
}
