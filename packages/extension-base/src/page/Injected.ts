// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Injected } from '@subwallet/extension-inject/types';
import type { SendRequest } from './types';

import Accounts from './Accounts';
import Metadata from './Metadata';
import PostMessageProvider from './PostMessageProvider';
import Signer from './Signer';

export default class implements Injected {
  public readonly accounts: Accounts;

  public readonly metadata: Metadata;

  public readonly provider: PostMessageProvider;

  public readonly signer: Signer;

  constructor (sendRequest: SendRequest) {
    this.accounts = new Accounts(sendRequest);
    this.metadata = new Metadata(sendRequest);
    this.provider = new PostMessageProvider(sendRequest);
    this.signer = new Signer(sendRequest);
  }
}
