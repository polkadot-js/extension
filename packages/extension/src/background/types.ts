// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeypairType } from '@polkadot/util-crypto/types';

export type MessageTypes = 'authorize.approve' | 'authorize.reject' | 'authorize.requests' | 'authorize.tab' | 'accounts.create' | 'accounts.edit' | 'accounts.forget' | 'accounts.list' | 'accounts.subscribe' | 'extrinsic.sign' | 'seed.create' | 'seed.validate' | 'signing.approve' | 'signing.cancel' | 'signing.requests';

export type AuthorizeRequest = [string, MessageAuthorize, string];

export type SigningRequest = [string, MessageExtrinsicSign, string];

export type MessageAuthorize = {
  origin: string
};

export type MessageAuthorizeApprove = {
  id: string;
};

export type MessageAuthorizeReject = {
  id: string;
};

export type MessageRequest = {
  id: string,
  message: MessageTypes,
  request: any
};

export type MessageResponse = {
  error?: string,
  id: string,
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
  id: string,
  password: string
};

export type MessageExtrinsicSignCancel = {
  id: string
};

export type MessageExtrinsicSign = {
  address: string,
  blockHash: string,
  genesisHash: string,
  method: string,
  nonce: string
};

export type MessageExtrinsicSign$Response = {
  id: string,
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
