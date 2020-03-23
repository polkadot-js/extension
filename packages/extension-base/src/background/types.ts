// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { InjectedAccount, ProviderList, ProviderMeta } from '@polkadot/extension-inject/types';
import { JsonRpcResponse } from '@polkadot/rpc-provider/types';
import { KeypairType } from '@polkadot/util-crypto/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import { TypeRegistry } from '@polkadot/types';

type KeysWithDefinedValues<T> = {
  [K in keyof T]: T[K] extends undefined ? never : K
}[keyof T];

type NoUndefinedValues<T> = {
  [K in KeysWithDefinedValues<T>]: T[K]
};

type IsNull<T, K extends keyof T> = { [K1 in Exclude<keyof T, K>]: T[K1] } & T[K] extends null ? K : never;

type NullKeys<T> = { [K in keyof T]: IsNull<T, K> }[keyof T];

export type SeedLengths = 12 | 24;

export interface AccountJson {
  address: string;
  genesisHash?: string | null;
  isExternal?: boolean;
  name?: string;
}

export interface AuthorizeRequest {
  id: string;
  request: RequestAuthorizeTab;
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
  'pri(accounts.create.suri)': [RequestAccountCreateSuri, boolean];
  'pri(accounts.edit)': [RequestAccountEdit, boolean];
  'pri(accounts.export)': [RequestAccountExport, ResponseAccountExport];
  'pri(accounts.forget)': [RequestAccountForget, boolean];
  'pri(accounts.subscribe)': [RequestAccountSubscribe, boolean, AccountJson[]];
  'pri(authorize.approve)': [RequestAuthorizeApprove, boolean];
  'pri(authorize.reject)': [RequestAuthorizeReject, boolean];
  'pri(authorize.subscribe)': [RequestAuthorizeSubscribe, boolean, AuthorizeRequest[]];
  'pri(seed.create)': [RequestSeedCreate, ResponseSeedCreate];
  'pri(seed.validate)': [RequestSeedValidate, ResponseSeedValidate];
  'pri(signing.approve.password)': [RequestSigningApprovePassword, boolean];
  'pri(signing.approve.signature)': [RequestSigningApproveSignature, boolean];
  'pri(signing.cancel)': [RequestSigningCancel, boolean];
  'pri(signing.subscribe)': [RequestSigningSubscribe, boolean, SigningRequest[]];
  'pri(window.open)': [null, boolean];
  // public/external requests, i.e. from a page
  'pub(accounts.list)': [RequestAccountList, InjectedAccount[]];
  'pub(accounts.subscribe)': [RequestAccountSubscribe, boolean, InjectedAccount[]];
  'pub(authorize.tab)': [RequestAuthorizeTab, null];
  'pub(bytes.sign)': [SignerPayloadRaw, ResponseSigning];
  'pub(extrinsic.sign)': [SignerPayloadJSON, ResponseSigning];
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

export interface RequestAccountEdit {
  address: string;
  genesisHash?: string | null;
  name: string;
}

export interface RequestAccountForget {
  address: string;
}

export interface RequestAccountExport {
  address: string;
  password: string;
}

export type RequestAccountList = null;

export type RequestAccountSubscribe = null;

export interface RequestRpcSend {
  method: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[];
}

export interface RequestRpcSubscribe extends RequestRpcSend {
  type: string;
}

export interface RequestRpcUnsubscribe {
  method: string;
  subscriptionId: number;
  type: string;
}

export interface RequestSigningApprovePassword {
  id: string;
  password: string;
}

export interface RequestSigningApproveSignature {
  id: string;
  signature: string;
}

export interface RequestSigningCancel {
  id: string;
}

export type RequestSigningSubscribe = null;

export interface RequestSeedCreate {
  length?: SeedLengths;
  type?: KeypairType;
}

export interface RequestSeedValidate {
  suri: string;
  type?: KeypairType;
}

// Responses

export type ResponseTypes = {
  [MessageType in keyof RequestSignatures]: RequestSignatures[MessageType][1]
};

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
  signature: string;
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
  exportedJson: string;
}

export type ResponseRpcListProviders = ProviderList;

// Subscriptions

export type SubscriptionMessageTypes = NoUndefinedValues<{
  [MessageType in keyof RequestSignatures]: RequestSignatures[MessageType][2]
}>;

export type MessageTypesWithSubscriptions = keyof SubscriptionMessageTypes;
export type MessageTypesWithNoSubscriptions = Exclude<MessageTypes, keyof SubscriptionMessageTypes>

export interface RequestSign {
  readonly inner: SignerPayloadJSON | SignerPayloadRaw;

  sign (registry: TypeRegistry, pair: KeyringPair): { signature: string };
}
