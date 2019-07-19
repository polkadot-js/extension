// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Injected as InjectedInjected } from '@polkadot/extension-inject/types';
import { SendRequest } from './types';

import Accounts from './Accounts';
import Signer from './Signer';

export default class Injected implements InjectedInjected {
  public readonly accounts: Accounts;

  public readonly signer: Signer;

  public readonly Provider: PostMessageProvider;

  public constructor (sendRequest: SendRequest) {
    this.accounts = new Accounts(sendRequest);
    this.signer = new Signer(sendRequest);
    this.provider = new PostMessageProvider();
    // so we want to create a PostMessageProvider for proxying?
  }
}
