// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExternalRequestPromise } from '@subwallet/extension-base/background/KoniTypes';
import { ResponseSigning } from '@subwallet/extension-base/background/types';

import { SignerPayloadJSON } from '@polkadot/types/types';

export enum KoniTransactionStatus {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED'
}

export interface KoniSigningTransaction {
  id: string;
  network: string;
  address: string;
  data: any;
  payload: SignerPayloadJSON;
  status: KoniTransactionStatus;
  extrinsicHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KoniTransaction extends KoniSigningTransaction {
  reject?: (error: Error) => void;
  resolve?: (result: ResponseSigning) => void;
  doStart?: () => void;
  sendRequest?: () => void;
  convertToRequest?: () => void;
}

export interface PrepareInternalRequest {
  id: string;
  addTransaction: (transaction: KoniTransaction) => void;
  convertToRequest: () => void;
}
