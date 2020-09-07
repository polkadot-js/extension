// Copyright 2019-2020 @polkadot/extension-inject authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Signer as InjectedSigner } from '@polkadot/api/types';
import { ProviderInterface } from '@polkadot/rpc-provider/types';

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
  subscribe: (cb: (accounts: InjectedAccount[]) => void | Promise<void>) => Unsubcall;
}

export interface InjectedExtensionInfo {
  name: string;
  version: string;
}

// Metadata about a provider
export interface ProviderMeta {
  // Network of the provider
  network: string;
  // Light or full node
  node: 'full' | 'light';
  // The extension source
  source: string;
  // Provider transport: 'WsProvider' etc.
  transport: string;
}

export interface MetadataDefBase {
  chain: string;
  genesisHash: string;
  icon: string;
  ss58Format: number;
}

export interface MetadataDef extends MetadataDefBase {
  color?: string;
  specVersion: number;
  tokenDecimals: number;
  tokenSymbol: string;
  types: Record<string, Record<string, string> | string>;
  metaCalls?: string;
}

export interface InjectedMetadataKnown {
  genesisHash: string;
  specVersion: number;
}

export interface InjectedMetadata {
  get: () => Promise<InjectedMetadataKnown[]>;
  provide: (definition: MetadataDef) => Promise<boolean>;
}

export type ProviderList = Record<string, ProviderMeta>

export interface InjectedProvider extends ProviderInterface {
  listProviders: () => Promise<ProviderList>;
  startProvider: (key: string) => Promise<ProviderMeta>;
}

export interface InjectedProviderWithMeta {
  // provider will actually always be a PostMessageProvider, which implements InjectedProvider
  provider: InjectedProvider;
  meta: ProviderMeta;
}

export interface Injected {
  accounts: InjectedAccounts;
  metadata?: InjectedMetadata;
  provider?: InjectedProvider;
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

export interface Web3AccountsOptions{
  ss58Prefix?: number
}
