// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeypairType } from '@polkadot/util-crypto/types';

export type MessageTypes = 'authorize.approve' | 'authorize.reject' | 'authorize.requests' | 'authorize.tab' | 'accounts.create' | 'accounts.edit' | 'accounts.forget' | 'accounts.list' | 'accounts.subscribe' | 'extrinsic.sign' | 'seed.create' | 'seed.validate' | 'signing.approve' | 'signing.cancel' | 'signing.requests';

export type AuthorizeRequest = [number, MessageAuthorize, string];

export type SigningRequest = [number, MessageExtrinsicSign, string];

export type MessageAuthorize = {
  origin: string
};

export type MessageAuthorizeApprove = {
  id: number;
};

export type MessageAuthorizeReject = {
  id: number;
};

export type MessageRequest = {
  id: number,
  message: MessageTypes,
  request: any
};

export type MessageResponse = {
  error?: string,
  id: number,
  response?: any,
  subscription?: any
};

export type MessageAccountCreate = {
  name: string,
  password: string,
  suri: string,
  type?: KeypairType
};

export type MessageAccountEdit= {
  address: string,
  name: string
};

export type MessageAccountForget = {
  address: string
};

export type MessageExtrinsicSignApprove = {
  id: number,
  password: string
};

export type MessageExtrinsicSignCancel = {
  id: number
};

export type MessageExtrinsicSign = {
  address: string,
  blockHash: string,
  genesisHash: string,
  method: string,
  nonce: string
};

export type MessageExtrinsicSign$Response = {
  id: number,
  signature: string
};

export type MessageSeedCreate$Response = {
  address: string,
  seed: string
};

export type MessageSeedCreate = {
  length?: 12 | 24,
  type?: KeypairType
};

export type MessageSeedValidate = {
  seed: string,
  type?: KeypairType
};

export type MessageSeedValidate$Response = {
  address: string,
  seed: string
};
