// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeypairType } from '@polkadot/util-crypto/types';

export type MessageTypes = 'authorize.approve' | 'authorize.reject' | 'authorize.requests' | 'authorize.subscribe' | 'authorize.tab' | 'accounts.create' | 'accounts.edit' | 'accounts.forget' | 'accounts.list' | 'accounts.subscribe' | 'extrinsic.sign' | 'seed.create' | 'seed.validate' | 'signing.approve' | 'signing.cancel' | 'signing.requests' | 'signing.subscribe';

export type AuthorizeRequest = [string, MessageAuthorize, string];

export type SigningRequest = [string, MessageExtrinsicSign, string];

export interface MessageAuthorize {
  origin: string;
}

export interface MessageAuthorizeApprove {
  id: string;
}

export interface MessageAuthorizeReject {
  id: string;
}

export interface MessageRequest {
  id: string;
  message: MessageTypes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any;
}

export interface MessageResponse {
  error?: string;
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscription?: any;
}

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

export interface MessageExtrinsicSignApprove {
  id: string;
  password: string;
}

export interface MessageExtrinsicSignCancel {
  id: string;
}

export interface MessageExtrinsicSign {
  address: string;
  blockHash: string;
  blockNumber: number;
  era?: string;
  genesisHash: string;
  method: string;
  nonce: string;
}

export interface MessageExtrinsicSignResponse {
  id: string;
  signature: string;
}

export interface MessageSeedCreateResponse {
  address: string;
  seed: string;
}

export interface MessageSeedCreate {
  length?: 12 | 24;
  type?: KeypairType;
}

export interface MessageSeedValidate {
  seed: string;
  type?: KeypairType;
}

export interface MessageSeedValidateResponse {
  address: string;
  seed: string;
}
