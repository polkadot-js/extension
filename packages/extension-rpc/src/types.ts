// Copyright 2019-2024 @polkadot/extension-rpc authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* global chrome */

import type { AccountJson, AllowedPath, AuthorizeRequest, ConnectedTabsUrlResponse, MetadataRequest, ResponseAuthorizeList, ResponseDeriveValidate, ResponseJsonGetAccountInfo, ResponseSigningIsLocked, SeedLengths, SigningRequest } from '@polkadot/extension-base/background/types';
import type { Chain } from '@polkadot/extension-chains/types';
import type { KeyringPair$Json } from '@polkadot/keyring/types';
import type { KeyringPairs$Json } from '@polkadot/ui-keyring/types';
import type { HexString } from '@polkadot/util/types';
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { MetadataDef, MetadataDefBase } from '@polkadot/extension-inject/types';

export type MetadataCache = Readonly<{
  getSavedMeta: (genesisHash: string) => Promise<MetadataDef | null> | undefined
  setSavedMeta: (genesisHash: string, def: Promise<MetadataDef | null>) => Map<string, Promise<MetadataDef | null>>
}>

export type MakeOptions = Readonly<{
  port: chrome.runtime.Port
  metadataCache: MetadataCache
  allChains: ReadonlyArray<MetadataDefBase>
}>

export type RPC = Readonly<{
  editAccount: (address: string, name: string) => Promise<boolean>;
  showAccount: (address: string, isShowing: boolean) => Promise<boolean>;
  tieAccount: (address: string, genesisHash: HexString | null) => Promise<boolean>;
  exportAccount: (address: string, password: string) => Promise<{ exportedJson: KeyringPair$Json }>;
  exportAccounts: (addresses: string[], password: string) => Promise<{ exportedJson: KeyringPairs$Json }>;
  validateAccount: (address: string, password: string) => Promise<boolean>;
  forgetAccount: (address: string) => Promise<boolean>;
  approveAuthRequest: (id: string, authorizedAccounts: string[]) => Promise<boolean>;
  approveMetaRequest: (id: string) => Promise<boolean>;
  cancelSignRequest: (id: string) => Promise<boolean>;
  isSignLocked: (id: string) => Promise<ResponseSigningIsLocked>;
  approveSignPassword: (id: string, savePass: boolean, password?: string) => Promise<boolean>;
  approveSignSignature: (id: string, signature: HexString) => Promise<boolean>;
  createAccountExternal: (name: string, address: string, genesisHash: HexString | null) => Promise<boolean>;
  createAccountHardware: (address: string, hardwareType: string, accountIndex: number, addressOffset: number, name: string, genesisHash: HexString) => Promise<boolean>;
  createAccountSuri: (name: string, password: string, suri: string, type?: KeypairType, genesisHash?: HexString | null) => Promise<boolean>;
  createSeed: (length?: SeedLengths, seed?: string, type?: KeypairType) => Promise<{ address: string; seed: string }>;
  getAllMetadata: () => Promise<MetadataDef[]>;
  getMetadata: (genesisHash?: string | null, isPartial?: boolean) => Promise<Chain | null>;
  getConnectedTabsUrl: () => Promise<ConnectedTabsUrlResponse>;
  rejectMetaRequest: (id: string) => Promise<boolean>;
  subscribeAccounts: (cb: (accounts: AccountJson[]) => void) => Promise<boolean>;
  subscribeAuthorizeRequests: (cb: (accounts: AuthorizeRequest[]) => void) => Promise<boolean>;
  getAuthList: () => Promise<ResponseAuthorizeList>;
  removeAuthorization: (url: string) => Promise<ResponseAuthorizeList>;
  updateAuthorization: (authorizedAccounts: string[], url: string) => Promise<void>;
  deleteAuthRequest: (requestId: string) => Promise<void>;
  subscribeMetadataRequests: (cb: (accounts: MetadataRequest[]) => void) => Promise<boolean>;
  subscribeSigningRequests: (cb: (accounts: SigningRequest[]) => void) => Promise<boolean>;
  validateSeed: (suri: string, type?: KeypairType) => Promise<{ address: string; suri: string }>;
  validateDerivationPath: (parentAddress: string, suri: string, parentPassword: string) => Promise<ResponseDeriveValidate>;
  deriveAccount: (parentAddress: string, suri: string, parentPassword: string, name: string, password: string, genesisHash: HexString | null) => Promise<boolean>;
  windowOpen: (path: AllowedPath) => Promise<boolean>;
  jsonGetAccountInfo: (json: KeyringPair$Json) => Promise<ResponseJsonGetAccountInfo>;
  jsonRestore: (file: KeyringPair$Json, password: string) => Promise<void>;
  batchRestore: (file: KeyringPairs$Json, password: string) => Promise<void>;
  setNotification: (notification: string) => Promise<boolean>;
  ping: () => Promise<boolean>;
}>
