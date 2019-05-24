// Copyright 2019 @polkadot/extension-dapp authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Signer } from '@polkadot/api/types';

export interface InjectedAccount {
  address: string;
  name: string;
}

export interface InjectedAccounts {
  get: () => Promise<Array<InjectedAccount>>;
}

export interface InjectedSigner extends Signer {}

export interface InjectedExtensionInfo {
  name: string;
  version: string;
}

export interface Injected {
  accounts: InjectedAccounts;
  signer: InjectedSigner;
}

export interface InjectedWindowProvider extends InjectedExtensionInfo {
  enable: (origin: string) => Promise<Injected>;
}

export type InjectedWindow = Window & {
  injectedWeb3: {
    [index: string]: InjectedWindowProvider
  }
};

export type InjectedExtension = InjectedExtensionInfo & Injected;
