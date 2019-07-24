// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SignerPayload } from '@polkadot/api/types';
import { KeypairType } from '@polkadot/util-crypto/types';

export type AuthorizeRequest = [string, MessageAuthorize['payload'], string];

export type SigningRequest = [string, MessageExtrinsicSign['payload'], string];

export type RequestMessage = MessageAuthorize | MessageAuthorizeApprove | MessageAuthorizeReject | MessageAuthorizeRequests | MessageAuthorizeSubscribe | MessageAccountCreate | MessageAccountEdit | MessageAccountForget | MessageAccountList | MessageAccountSubscribe | MessageSeedCreate | MessageSeedValidate | MessageExtrinsicSign | MessageExtrinsicSignApprove | MessageExtrinsicSignCancel | MessageExtrinsicSignRequests | MessageExtrinsicSignSubscribe;
export type ResponseMessage = MessageExtrinsicSignResponse | MessageSeedCreateResponse | MessageSeedValidateResponse;
export type Message = RequestMessage | ResponseMessage;

// Requests

export interface TransportRequestMessage<TMessage extends RequestMessage> {
  id: string,
  message: TMessage['message'],
  origin: 'page' | 'popup',
  request: TMessage['payload']
}

export interface MessageAuthorize {
  message: 'authorize.tab';
  payload: {
    origin: string;
  }
}

export interface MessageAuthorizeApprove {
  message: 'authorize.approve';
  payload: {
    id: string;
  }
}

export interface MessageAuthorizeReject {
  message: 'authorize.reject';
  payload: {
    id: string;
  }
}

export interface MessageAuthorizeRequests {
  message: 'authorize.requests';
  payload: null;
}

export interface MessageAuthorizeSubscribe {
  message: 'authorize.subscribe';
  payload: null;
}

export interface MessageAccountCreate {
  message: 'accounts.create';
  payload: {
    name: string;
    password: string;
    suri: string;
    type?: KeypairType;
  }
}

export interface MessageAccountEdit {
  message: 'accounts.edit';
  payload: {
    address: string;
    name: string;
  }
}

export interface MessageAccountForget {
  message: 'accounts.forget';
  payload: {
    address: string;
  }
}

export interface MessageAccountList {
  message: 'accounts.list';
  payload: null
}

export interface MessageAccountSubscribe {
  message: 'accounts.subscribe';
  payload: null
}

export interface MessageSeedCreate {
  message: 'seed.create',
  payload: {
    length?: 12 | 24;
    type?: KeypairType;
  }
}

export interface MessageSeedValidate {
  message: 'seed.validate',
  payload: {
    seed: string;
    type?: KeypairType;
  }
}

export interface MessageExtrinsicSign {
  message: 'extrinsic.sign';
  payload: SignerPayload
}

export interface MessageExtrinsicSignApprove {
  message: 'signing.approve';
  payload: {
    id: string;
    password: string;
  }
}

export interface MessageExtrinsicSignCancel {
  message: 'signing.cancel';
  payload: {
    id: string;
  }
}

export interface MessageExtrinsicSignRequests {
  message: 'signing.requests';
  payload: null
}

export interface MessageExtrinsicSignSubscribe {
  message: 'signing.subscribe';
  payload: null
}

// Responses

export interface TransportResponseMessage {
  error?: string;
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscription?: any;
}

export interface MessageExtrinsicSignResponse {
  payload: {
    id: string;
    signature: string;
  }
}

export interface MessageSeedCreateResponse {
  payload: {
    address: string;
    seed: string;
  }
}

export interface MessageSeedValidateResponse {
  payload: {
    address: string;
    seed: string;
  }
}
