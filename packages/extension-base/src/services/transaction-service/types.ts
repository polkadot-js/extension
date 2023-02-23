// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmSendTransactionRequest } from '@subwallet/extension-base/background/KoniTypes';
import EventEmitter from 'eventemitter3';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

export enum KoniTransactionStatus {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED'
}

export interface SWTransaction {
  id: string;
  url?: string;
  isInternal: boolean,
  chain: string;
  chainType: 'substrate' | 'ethereum';
  address: string;
  data: any;
  status: KoniTransactionStatus;
  extrinsicHash: string;
  extrinsicType: string;
  createdAt: Date;
  updatedAt: Date;
  errors?: string[];
  transaction: SubmittableExtrinsic | EvmSendTransactionRequest;
}

export type SWTransactionInput = Pick<SWTransaction, 'address' | 'url' | 'transaction' | 'data' | 'extrinsicType' | 'chain' | 'chainType'>

export type SendTransactionEvents = 'extrinsicHash' | 'error' | 'success';

export type TransactionEmitter = EventEmitter<SendTransactionEvents, TransactionEventResponse>;

export interface TransactionEventResponse {
  id: string,
  extrinsicHash?: string,
  error?: Error
}

export interface PrepareInternalRequest {
  id: string;
  addTransaction: (transaction: SWTransaction) => void;
  convertToRequest: () => void;
}
