// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SignerPayload } from '@polkadot/api/types';
import { KeypairType } from '@polkadot/util-crypto/types';
import { InjectedAccount } from '@polkadot/extension-inject/types';

export type SeedLengths = 12 | 24;

export type AuthorizeRequest = [string, RequestAuthorizeTab, string];
export type SigningRequest = [string, RequestExtrinsicSign, string];

// [MessageType]: [RequestType, ResponseType]
export interface RequestSignatures {
  'accounts.create': [RequestAccountCreate, boolean];
  'accounts.edit': [RequestAccountEdit, boolean];
  'accounts.forget': [RequestAccountForget, boolean];
  'accounts.list': [RequestAccountList, InjectedAccount[]];
  'accounts.subscribe': [RequestAccountSubscribe, boolean];
  'authorize.tab': [RequestAuthorizeTab, null];
  'authorize.approve': [RequestAuthorizeApprove, boolean];
  'authorize.reject': [RequestAuthorizeReject, boolean];
  'authorize.requests': [RequestAuthorizeRequests, AuthorizeRequest[]];
  'authorize.subscribe': [RequestAuthorizeSubscribe, boolean];
  'extrinsic.sign': [RequestExtrinsicSign, ResponseExtrinsicSign];
  'seed.create': [RequestSeedCreate, ResponseSeedCreate];
  'seed.validate': [RequestSeedValidate, ResponseSeedValidate];
  'signing.approve': [RequestSigningApprove, boolean];
  'signing.cancel': [RequestSigningCancel, boolean];
  'signing.requests': [RequestSigningRequests, SigningRequest[]];
  'signing.subscribe': [RequestSigningSubscribe, boolean];
}

export type MessageTypes = keyof RequestSignatures;

// Requests

export type RequestTypes = {
  [MessageType in keyof RequestSignatures]: RequestSignatures[MessageType][0]
};

type IsNull<T, K extends keyof T> = { [K1 in Exclude<keyof T, K>]: T[K1] } & T[K] extends null ? K : never
type NullKeys<T> = { [K in keyof T]: IsNull<T, K> }[keyof T]
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

export interface RequestAccountCreate {
  name: string;
  password: string;
  suri: string;
  type?: KeypairType;
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

export type RequestExtrinsicSign = SignerPayload;

export interface RequestSigningApprove {
  id: string;
  password: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscription?: any;
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
