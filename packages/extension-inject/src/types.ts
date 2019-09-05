// Copyright 2019 @polkadot/extension-dapp authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Signer as InjectedSigner } from '@polkadot/api/types';

// eslint-disable-next-line no-undef
type This = typeof globalThis;

export type Unsubcall = () => void;

export interface InjectedAccount {
  address: string;
  genesisHash?: string | null;
  name?: string;
}

export interface InjectedAccountWithMeta {
  address: string;
  meta: {
    genesisHash?: string | null;
    name?: string;
    source: string;
  };
}

export interface InjectedAccounts {
  get: () => Promise<InjectedAccount[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe: (cb: (accounts: InjectedAccount[]) => any) => Unsubcall;
}
export interface InjectedExtensionInfo {
  name: string;
  version: string;
}

export interface Injected {
  accounts: InjectedAccounts;
  signer: InjectedSigner;
}

export interface InjectedWindowProvider {
  enable: (origin: string) => Promise<Injected>;
  version: string;
}

export interface InjectedWindow extends This {
  injectedWeb3: Record<string, InjectedWindowProvider>;
}

export type InjectedExtension = InjectedExtensionInfo & Injected;

export type InjectOptions = InjectedExtensionInfo;
