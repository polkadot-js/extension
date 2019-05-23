// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Injected as IInjected, SendRequest, Version } from './types';

import Accounts from './Accounts';
import Signer from './Signer';

export default class Injected implements IInjected {
  readonly accounts: Accounts;
  readonly signer: Signer;

  constructor (sendRequest: SendRequest) {
    this.accounts = new Accounts(sendRequest);
    this.signer = new Signer(sendRequest);
  }

  get version (): Version {
    return 0;
  }
}
