// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SignerPayload } from '@polkadot/api/types';
import { KeypairType } from '@polkadot/util-crypto/types';
import { InjectedAccount } from '@polkadot/extension-inject/types';

export type AuthorizeRequest = [string, MessageAuthorize, string];
export type SigningRequest = [string, MessageExtrinsicSign, string];

// Requests

export type MessageTypes = keyof PayloadTypes;

export interface TransportRequestMessage<TMessageType extends MessageTypes> {
  id: string;
  message: TMessageType;
  origin: 'page' | 'popup';
  request: PayloadTypes[TMessageType];
}

export interface PayloadTypes {
  'accounts.create': MessageAccountCreate;
  'accounts.edit': MessageAccountEdit;
  'accounts.forget': MessageAccountForget;
  'accounts.list': MessageAccountList;
  'accounts.subscribe': MessageAccountSubscribe;
  'authorize.tab': MessageAuthorize;
  'authorize.approve': MessageAuthorizeApprove;
  'authorize.reject': MessageAuthorizeReject;
  'authorize.requests': MessageAuthorizeRequests;
  'authorize.subscribe': MessageAuthorizeSubscribe;
  'extrinsic.sign': MessageExtrinsicSign;
  'seed.create': MessageSeedCreate;
  'seed.validate': MessageSeedValidate;
  'signing.approve': MessageExtrinsicSignApprove;
  'signing.cancel': MessageExtrinsicSignCancel;
  'signing.requests': MessageExtrinsicSignRequests;
  'signing.subscribe': MessageExtrinsicSignSubscribe;
}

type IsNull<T, K extends keyof T> = { [K1 in Exclude<keyof T, K>]: T[K1] } & T[K] extends null ? K : never
type NullKeys<T> = { [K in keyof T]: IsNull<T, K> }[keyof T]
export type NullMessageTypes = NullKeys<PayloadTypes>

export interface MessageAuthorize {
  origin: string;
}

export interface MessageAuthorizeApprove {
  id: string;
}

export interface MessageAuthorizeReject {
  id: string;
}

export type MessageAuthorizeRequests = null;

export type MessageAuthorizeSubscribe = null;

export interface MessageAccountCreate {
  name: string;
  password: string;
  suri: string;
  type?: KeypairType;
}

export interface MessageAccountEdit {
  address: string;
  name: string;
}

export interface MessageAccountForget {
  address: string;
}

export type MessageAccountList = null;

export type MessageAccountSubscribe = null;

export type MessageExtrinsicSign = SignerPayload;

export interface MessageExtrinsicSignApprove {
  id: string;
  password: string;
}

export interface MessageExtrinsicSignCancel {
  id: string;
}

export type MessageExtrinsicSignRequests = null;

export type MessageExtrinsicSignSubscribe = null;

export interface MessageSeedCreate {
  length?: 12 | 24;
  type?: KeypairType;
}

export interface MessageSeedValidate {
  suri: string;
  type?: KeypairType;
}

// Responses

export interface ResponseTypes {
  'accounts.create': boolean;
  'accounts.edit': boolean;
  'accounts.forget': boolean;
  'accounts.list': InjectedAccount[];
  'accounts.subscribe': boolean;
  'authorize.tab': null;
  'authorize.approve': boolean;
  'authorize.reject': boolean;
  'authorize.requests': AuthorizeRequest[];
  'authorize.subscribe': boolean;
  'extrinsic.sign': MessageExtrinsicSignResponse;
  'seed.create': MessageSeedCreateResponse;
  'seed.validate': MessageSeedValidateResponse;
  'signing.approve': boolean;
  'signing.cancel': boolean;
  'signing.requests': SigningRequest[];
  'signing.subscribe': boolean;
}

export interface TransportResponseMessage<TMessage extends ResponseMessage> {
  error?: string;
  id: string;
  response?: TMessage;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscription?: any;
}

export type ResponseMessage = MessageExtrinsicSignResponse | MessageSeedCreateResponse | MessageSeedValidateResponse;

export interface MessageExtrinsicSignResponse {
  id: string;
  signature: string;
}

export interface MessageSeedCreateResponse {
  address: string;
  seed: string;
}

export interface MessageSeedValidateResponse {
  address: string;
  suri: string;
}
