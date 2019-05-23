// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Signer as SignerInterface } from '@polkadot/api/types';

export type Version = 0;

export interface Account {
  readonly address: string; // ss-58 encoded address
  readonly name?: string; // optional name for display
}

export interface Accounts {
  get: () => Promise<Array<Account>>;
}

export interface Signer extends SignerInterface {
  // no specific signer extensions
}

export interface Injected {
  readonly accounts: Accounts;
  readonly signer: Signer;
  readonly version: Version;
}

export interface SendRequest {
  (message: string, request?: any): Promise<any>;
}

export type WindowInjected = Window & {
  injectedWeb3: {
    [index: string]: Injected
  }
};
