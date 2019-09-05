// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { InjectedAccount } from '@polkadot/extension-inject/types';
import { KeyringJson } from '@polkadot/ui-keyring/types';
import { KeypairType } from '@polkadot/util-crypto/types';
import { SignerPayloadJSON } from '@polkadot/types/types';

type KeysWithDefinedValues<T> = {
  [P in keyof T]: undefined extends T[P] ? P : never
}[keyof T];

type IsNull<T, K extends keyof T> = { [K1 in Exclude<keyof T, K>]: T[K1] } & T[K] extends null ? K : never
type NullKeys<T> = { [K in keyof T]: IsNull<T, K> }[keyof T]

export type SeedLengths = 12 | 24;

export interface AuthorizeRequest {
  id: string;
  request: RequestAuthorizeTab;
  url: string;
}

export interface SigningRequest {
  id: string;
  isExternal: boolean;
  request: RequestExtrinsicSign;
  url: string;
}

export interface AccountJson {
  address: string;
  genesisHash?: string | null;
  isExternal?: boolean;
  name?: string;
}

// [MessageType]: [RequestType, ResponseType, SubscriptionMessageType?]
export interface RequestSignatures {
  // private/internal requests, i.e. from a popup
  'pri(accounts.create.external)': [RequestAccountCreateExternal, boolean];
  'pri(accounts.create.suri)': [RequestAccountCreateSuri, boolean];
  'pri(accounts.edit)': [RequestAccountEdit, boolean];
  'pri(accounts.forget)': [RequestAccountForget, boolean];
  'pri(accounts.list)': [RequestAccountList, KeyringJson[]];
  'pri(accounts.subscribe)': [RequestAccountSubscribe, boolean, KeyringJson[]];
  'pri(authorize.approve)': [RequestAuthorizeApprove, boolean];
  'pri(authorize.reject)': [RequestAuthorizeReject, boolean];
  'pri(authorize.requests)': [RequestAuthorizeRequests, AuthorizeRequest[]];
  'pri(authorize.subscribe)': [RequestAuthorizeSubscribe, boolean, AuthorizeRequest[]];
  'pri(seed.create)': [RequestSeedCreate, ResponseSeedCreate];
  'pri(seed.validate)': [RequestSeedValidate, ResponseSeedValidate];
  'pri(signing.approve.password)': [RequestSigningApprovePassword, boolean];
  'pri(signing.approve.signature)': [RequestSigningApproveSignature, boolean];
  'pri(signing.cancel)': [RequestSigningCancel, boolean];
  'pri(signing.requests)': [RequestSigningRequests, SigningRequest[]];
  'pri(signing.subscribe)': [RequestSigningSubscribe, boolean, SigningRequest[]];
  // public/external requests, i.e. from a page
  'pub(accounts.list)': [RequestAccountList, InjectedAccount[]];
  'pub(accounts.subscribe)': [RequestAccountSubscribe, boolean, InjectedAccount[]];
  'pub(authorize.tab)': [RequestAuthorizeTab, null];
  'pub(extrinsic.sign)': [RequestExtrinsicSign, ResponseExtrinsicSign];
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
  origin: 'page' | 'popup';
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

export type RequestAuthorizeRequests = null;

export type RequestAuthorizeSubscribe = null;

export interface RequestAccountCreateSuri {
  name: string;
  password: string;
  suri: string;
  type?: KeypairType;
}

export interface RequestAccountCreateExternal {
  address: string;
  genesisHash: string;
  name: string;
}

export interface RequestAccountEdit {
  address: string;
  name: string;
}

export interface RequestAccountForget {
  address: string;
}

export type RequestAccountList = null;

export type RequestAccountSubscribe = null;

export type RequestExtrinsicSign = SignerPayloadJSON;

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

export type RequestSigningRequests = null;

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

export interface TransportResponseMessage<TMessageType extends MessageTypes> {
  error?: string;
  id: string;
  response?: ResponseTypes[TMessageType];
  subscription?: SubscriptionMessageTypes[TMessageType];
}

export interface ResponseExtrinsicSign {
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

// Subscriptions

export type SubscriptionMessageTypes = {
  [MessageType in keyof RequestSignatures]: RequestSignatures[MessageType][2]
};

export type MessageTypesWithNoSubscriptions = KeysWithDefinedValues<SubscriptionMessageTypes>;
