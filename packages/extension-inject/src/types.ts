// Copyright 2019 @polkadot/extension-dapp authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Signer } from '@polkadot/api/types';
import { ProviderInterface } from '@polkadot/rpc-provider/types';

export type Unsubcall = () => void;

export interface InjectedAccount {
  address: string;
  name: string;
}

export interface InjectedAccountWithMeta {
  address: string;
  meta: {
    name: string;
    source: string;
  };
}

export interface InjectedAccounts {
  get: () => Promise<InjectedAccount[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe: (cb: (accounts: InjectedAccount[]) => any) => Unsubcall;
}

export type InjectedSigner = Signer;

export type InjectedProvider = ProviderInterface;

export interface InjectedProviderWithMeta {
  provider: InjectedProvider;
  meta: {
    source: string;
  };
}

export interface InjectedExtensionInfo {
  name: string;
  version: string;
}

export interface Injected {
  accounts: InjectedAccounts;
  signer: InjectedSigner;
  provider?: InjectedProvider;
}

export interface InjectedWindowProvider {
  enable: (origin: string) => Promise<Injected>;
  version: string;
}

export interface InjectedWindow extends Window {
  injectedWeb3: Record<string, InjectedWindowProvider>;
}

export type InjectedExtension = InjectedExtensionInfo & Injected;

export type InjectOptions = InjectedExtensionInfo;
