// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-use-before-define */

import type { InjectedAccount, InjectedMetadataKnown, MetadataDef, ProviderList, ProviderMeta } from '@polkadot/extension-inject/types';
import type { KeyringPair, KeyringPair$Json, KeyringPair$Meta } from '@polkadot/keyring/types';
import type { JsonRpcResponse } from '@polkadot/rpc-provider/types';
import type { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import type { KeyringPairs$Json } from '@polkadot/ui-keyring/types';
import type { HexString } from '@polkadot/util/types';
import type { KeypairType } from '@polkadot/util-crypto/types';

import { TypeRegistry } from '@polkadot/types';

import { ALLOWED_PATH } from '../defaults';
import { AuthUrls } from './handlers/State';

type KeysWithDefinedValues<T> = {
  [K in keyof T]: T[K] extends undefined ? never : K
}[keyof T];

type NoUndefinedValues<T> = {
  [K in KeysWithDefinedValues<T>]: T[K]
};

type IsNull<T, K extends keyof T> = { [K1 in Exclude<keyof T, K>]: T[K1] } & T[K] extends null ? K : never;

type NullKeys<T> = { [K in keyof T]: IsNull<T, K> }[keyof T];

export type SeedLengths = 12 | 24;

export interface AccountJson extends KeyringPair$Meta {
  address: string;
  genesisHash?: string | null;
  isExternal?: boolean;
  isHardware?: boolean;
  isHidden?: boolean;
  name?: string;
  parentAddress?: string;
  suri?: string;
  type?: KeypairType;
  whenCreated?: number;
}

export type AccountWithChildren = AccountJson & {
  children?: AccountWithChildren[];
}

export type AccountsContext = {
  accounts: AccountJson[];
  hierarchy: AccountWithChildren[];
  master?: AccountJson;
}

export interface AuthorizeRequest {
  id: string;
  request: RequestAuthorizeTab;
  url: string;
}

export interface MetadataRequest {
  id: string;
  request: MetadataDef;
  url: string;
}

export interface SigningRequest {
  account: AccountJson;
  id: string;
  request: RequestSign;
  url: string;
}

// [MessageType]: [RequestType, ResponseType, SubscriptionMessageType?]
export interface RequestSignatures {
  // private/internal requests, i.e. from a popup
  'pri(accounts.create.external)': [RequestAccountCreateExternal, boolean];
  'pri(accounts.create.hardware)': [RequestAccountCreateHardware, boolean];
  'pri(accounts.create.suri)': [RequestAccountCreateSuri, boolean];
  'pri(accounts.edit)': [RequestAccountEdit, boolean];
  'pri(accounts.export)': [RequestAccountExport, ResponseAccountExport];
  'pri(accounts.batchExport)': [RequestAccountBatchExport, ResponseAccountsExport]
  'pri(accounts.forget)': [RequestAccountForget, boolean];
  'pri(accounts.show)': [RequestAccountShow, boolean];
  'pri(accounts.tie)': [RequestAccountTie, boolean];
  'pri(accounts.subscribe)': [RequestAccountSubscribe, boolean, AccountJson[]];
  'pri(accounts.validate)': [RequestAccountValidate, boolean];
  'pri(accounts.changePassword)': [RequestAccountChangePassword, boolean];
  'pri(authorize.approve)': [RequestAuthorizeApprove, boolean];
  'pri(authorize.list)': [null, ResponseAuthorizeList];
  'pri(authorize.reject)': [RequestAuthorizeReject, boolean];
  'pri(authorize.requests)': [RequestAuthorizeSubscribe, boolean, AuthorizeRequest[]];
  'pri(authorize.toggle)': [string, ResponseAuthorizeList];
  'pri(derivation.create)': [RequestDeriveCreate, boolean];
  'pri(derivation.validate)': [RequestDeriveValidate, ResponseDeriveValidate];
  'pri(json.restore)': [RequestJsonRestore, void];
  'pri(json.batchRestore)': [RequestBatchRestore, void];
  'pri(json.account.info)': [KeyringPair$Json, ResponseJsonGetAccountInfo];
  'pri(metadata.approve)': [RequestMetadataApprove, boolean];
  'pri(metadata.get)': [string | null, MetadataDef | null];
  'pri(metadata.reject)': [RequestMetadataReject, boolean];
  'pri(metadata.requests)': [RequestMetadataSubscribe, boolean, MetadataRequest[]];
  'pri(metadata.list)': [null, MetadataDef[]];
  'pri(seed.create)': [RequestSeedCreate, ResponseSeedCreate];
  'pri(seed.validate)': [RequestSeedValidate, ResponseSeedValidate];
  'pri(settings.notification)': [string, boolean];
  'pri(signing.approve.password)': [RequestSigningApprovePassword, boolean];
  'pri(signing.approve.signature)': [RequestSigningApproveSignature, boolean];
  'pri(signing.cancel)': [RequestSigningCancel, boolean];
  'pri(signing.isLocked)': [RequestSigningIsLocked, ResponseSigningIsLocked];
  'pri(signing.requests)': [RequestSigningSubscribe, boolean, SigningRequest[]];
  'pri(window.open)': [AllowedPath, boolean];
  // public/external requests, i.e. from a page
  'pub(accounts.list)': [RequestAccountList, InjectedAccount[]];
  'pub(accounts.subscribe)': [RequestAccountSubscribe, boolean, InjectedAccount[]];
  'pub(authorize.tab)': [RequestAuthorizeTab, null];
  'pub(bytes.sign)': [SignerPayloadRaw, ResponseSigning];
  'pub(extrinsic.sign)': [SignerPayloadJSON, ResponseSigning];
  'pub(metadata.list)': [null, InjectedMetadataKnown[]];
  'pub(metadata.provide)': [MetadataDef, boolean];
  'pub(phishing.redirectIfDenied)': [null, boolean];
  'pub(rpc.listProviders)': [void, ResponseRpcListProviders];
  'pub(rpc.send)': [RequestRpcSend, JsonRpcResponse];
  'pub(rpc.startProvider)': [string, ProviderMeta];
  'pub(rpc.subscribe)': [RequestRpcSubscribe, number, JsonRpcResponse];
  'pub(rpc.subscribeConnected)': [null, boolean, boolean];
  'pub(rpc.unsubscribe)': [RequestRpcUnsubscribe, boolean];
}

export type MessageTypes = keyof RequestSignatures;

// Requests

export type RequestTypes = {
  [MessageType in keyof RequestSignatures]: RequestSignatures[MessageType][0]
};

export type MessageTypesWithNullRequest = NullKeys<RequestTypes>

export interface TransportRequestMessage<TMessageType extends MessageTypes> {
  id: string;
  message: TMessageType;
  origin: 'page' | 'extension';
  request: RequestTypes[TMessageType];
}

export interface RequestAuthorizeTab {
  origin: string;
}

export interface RequestAuthorizeApprove {
  id: string;
}

export interface RequestAuthorizeReject {
  id: string;
}

export type RequestAuthorizeSubscribe = null;

export interface RequestMetadataApprove {
  id: string;
}

export interface RequestMetadataReject {
  id: string;
}

export type RequestMetadataSubscribe = null;

export interface RequestAccountCreateExternal {
  address: string;
  genesisHash?: string | null;
  name: string;
}

export interface RequestAccountCreateSuri {
  name: string;
  genesisHash?: string | null;
  password: string;
  suri: string;
  type?: KeypairType;
}

export interface RequestAccountCreateHardware {
  accountIndex: number;
  address: string;
  addressOffset: number;
  genesisHash: string;
  hardwareType: string;
  name: string;
}

export interface RequestAccountChangePassword {
  address: string;
  oldPass: string;
  newPass: string;
}

export interface RequestAccountEdit {
  address: string;
  genesisHash?: string | null;
  name: string;
}

export interface RequestAccountForget {
  address: string;
}

export interface RequestAccountShow {
  address: string;
  isShowing: boolean;
}

export interface RequestAccountTie {
  address: string;
  genesisHash: string | null;
}

export interface RequestAccountValidate {
  address: string;
  password: string;
}

export interface RequestDeriveCreate {
  name: string;
  genesisHash?: string | null;
  suri: string;
  parentAddress: string;
  parentPassword: string;
  password: string;
}

export interface RequestDeriveValidate {
  suri: string;
  parentAddress: string;
  parentPassword: string;
}

export interface RequestAccountExport {
  address: string;
  password: string;
}

export interface RequestAccountBatchExport {
  addresses: string[];
  password: string;
}

export interface RequestAccountList {
  anyType?: boolean;
}

export type RequestAccountSubscribe = null;

export interface RequestRpcSend {
  method: string;
  params: unknown[];
}

export interface RequestRpcSubscribe extends RequestRpcSend {
  type: string;
}

export interface RequestRpcUnsubscribe {
  method: string;
  subscriptionId: number | string;
  type: string;
}

export interface RequestSigningApprovePassword {
  id: string;
  password?: string;
  savePass: boolean;
}

export interface RequestSigningApproveSignature {
  id: string;
  signature: HexString;
}

export interface RequestSigningCancel {
  id: string;
}

export interface RequestSigningIsLocked {
  id: string;
}

export interface ResponseSigningIsLocked {
  isLocked: boolean;
  remainingTime: number;
}

export type RequestSigningSubscribe = null;

export interface RequestSeedCreate {
  length?: SeedLengths;
  type?: KeypairType;
  customEthDerivationPath?: string;
}

export interface RequestSeedValidate {
  suri: string;
  type?: KeypairType;
  customEthDerivationPath?: string;
}

// Responses

export type ResponseTypes = {
  [MessageType in keyof RequestSignatures]: RequestSignatures[MessageType][1]
};

export type ResponseType<TMessageType extends keyof RequestSignatures> = RequestSignatures[TMessageType][1];

interface TransportResponseMessageSub<TMessageType extends MessageTypesWithSubscriptions> {
  error?: string;
  id: string;
  response?: ResponseTypes[TMessageType];
  subscription?: SubscriptionMessageTypes[TMessageType];
}

interface TransportResponseMessageNoSub<TMessageType extends MessageTypesWithNoSubscriptions> {
  error?: string;
  id: string;
  response?: ResponseTypes[TMessageType];
}

export type TransportResponseMessage<TMessageType extends MessageTypes> =
  TMessageType extends MessageTypesWithNoSubscriptions
    ? TransportResponseMessageNoSub<TMessageType>
    : TMessageType extends MessageTypesWithSubscriptions
      ? TransportResponseMessageSub<TMessageType>
      : never;

export interface ResponseSigning {
  id: string;
  signature: HexString;
}

export interface ResponseDeriveValidate {
  address: string;
  suri: string;
}

export interface ResponseSeedCreate {
  address: string;
  seed: string;
}

export interface ResponseSeedValidate {
  address: string;
  suri: string;
}

export interface ResponseAccountExport {
  exportedJson: KeyringPair$Json;
}

export interface ResponseAccountsExport {
  exportedJson: KeyringPairs$Json;
}

export type ResponseRpcListProviders = ProviderList;

// Subscriptions

export type SubscriptionMessageTypes = NoUndefinedValues<{
  [MessageType in keyof RequestSignatures]: RequestSignatures[MessageType][2]
}>;

export type MessageTypesWithSubscriptions = keyof SubscriptionMessageTypes;
export type MessageTypesWithNoSubscriptions = Exclude<MessageTypes, keyof SubscriptionMessageTypes>

export interface RequestSign {
  readonly payload: SignerPayloadJSON | SignerPayloadRaw;

  sign (registry: TypeRegistry, pair: KeyringPair): { signature: HexString };
}

export interface RequestJsonRestore {
  file: KeyringPair$Json;
  password: string;
}

export interface RequestBatchRestore {
  file: KeyringPairs$Json;
  password: string;
}

export interface ResponseJsonRestore {
  error: string | null;
}

export type AllowedPath = typeof ALLOWED_PATH[number];

export interface ResponseJsonGetAccountInfo {
  address: string;
  name: string;
  genesisHash: string;
  type: KeypairType;
}

export interface ResponseAuthorizeList {
  list: AuthUrls;
}
