// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { InjectedAccounts, InjectedAccount, Unsubcall } from '@polkadot/extension-inject/types';
import { SendRequest } from './types';

let sendRequest: SendRequest;

export default class Accounts implements InjectedAccounts {
  public constructor (_sendRequest: SendRequest) {
    sendRequest = _sendRequest;
  }

  public get (): Promise<InjectedAccount[]> {
    return sendRequest('pub(accounts.list)');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public subscribe (cb: (accounts: InjectedAccount[]) => any): Unsubcall {
    sendRequest('pub(accounts.subscribe)', null, cb)
      .catch((error: Error) => console.error(error));

    return (): void => {
      // FIXME we need the ability to unsubscribe
    };
  }
}
