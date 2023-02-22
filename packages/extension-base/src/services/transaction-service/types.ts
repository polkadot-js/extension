// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExternalRequestPromise } from '@subwallet/extension-base/background/KoniTypes';
import { ResponseSigning } from '@subwallet/extension-base/background/types';

import { SignerPayloadJSON } from '@polkadot/types/types';
import {SubmittableExtrinsic} from "@polkadot/api/promise/types";
import { Transaction } from 'ethereumjs-tx';
import {ChainType} from "@polkadot/types/interfaces";
import {TransactionConfig} from "web3-core";

export enum KoniTransactionStatus {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED'
}

export interface SWTransaction {
  id: string;
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
  transaction: SubmittableExtrinsic | TransactionConfig;
}

export type SWTransactionInput = Pick<SWTransaction, 'address' | 'transaction' | 'data' | 'extrinsicType' | 'chain' | 'chainType'>

export type SendTransactionEvents = 'extrinsicHash' | 'error' | 'success';

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
