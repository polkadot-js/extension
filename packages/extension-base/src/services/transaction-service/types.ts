// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { AmountData, ChainType, ExtrinsicStatus, ExtrinsicType, ValidateTransactionResponse } from '@subwallet/extension-base/background/KoniTypes';
import EventEmitter from 'eventemitter3';
import { TransactionConfig } from 'web3-core';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

export interface SWTransactionValidation extends ValidateTransactionResponse{
  chain: string,
  chainType: ChainType,
  address: string,
  estimateFee: AmountData
}

export interface SWTransactionValidationInput extends Omit<SWTransactionValidation, 'estimateFee'> {
  transaction: SWTransaction['transaction'] | null;
}

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
  estimateFee?: AmountData,
  transaction: SubmittableExtrinsic | TransactionConfig;
  validateId: string;
}

export type SWTransactionResult = Omit<SWTransaction, 'transaction'>

export type SWTransactionInput = Pick<SWTransaction, 'address' | 'url' | 'transaction' | 'data' | 'extrinsicType' | 'chain' | 'chainType' | 'validateId'>

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
