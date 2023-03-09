// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { ChainType, EvmSendTransactionRequest, ExtrinsicStatus, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import EventEmitter from 'eventemitter3';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

export interface SWTransaction {
  id: string;
  url?: string;
  isInternal: boolean,
  chain: string;
  chainType: ChainType;
  address: string;
  data: any;
  status: ExtrinsicStatus;
  extrinsicHash: string;
  extrinsicType: ExtrinsicType;
  createdAt: Date;
  updatedAt: Date;
  errors?: string[];
  transaction: SubmittableExtrinsic | Omit<EvmSendTransactionRequest, 'hashPayload'>;
}

export type SWTransactionResult = Omit<SWTransaction, 'transaction' | 'data'>

export type SWTransactionInput = Pick<SWTransaction, 'address' | 'url' | 'transaction' | 'data' | 'extrinsicType' | 'chain' | 'chainType'>

export type SendTransactionEvents = 'extrinsicHash' | 'error' | 'success';

export type TransactionEmitter = EventEmitter<SendTransactionEvents, TransactionEventResponse>;

export interface TransactionEventResponse {
  id: string,
  extrinsicHash?: string,
  error?: TransactionError
}

export interface PrepareInternalRequest {
  id: string;
  addTransaction: (transaction: SWTransaction) => void;
  convertToRequest: () => void;
}
