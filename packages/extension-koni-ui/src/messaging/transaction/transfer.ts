// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AmountData, RequestCrossChainTransfer, RequestMaxTransferable, RequestTransfer, RequestTransferCheckReferenceCount, RequestTransferCheckSupporting, RequestTransferExistentialDeposit, SupportTransferResponse } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';

import { sendMessage } from '../base';

export async function makeTransfer (request: RequestTransfer): Promise<SWTransactionResponse> {
  return sendMessage('pri(accounts.transfer)', request);
}

export async function makeCrossChainTransfer (request: RequestCrossChainTransfer): Promise<SWTransactionResponse> {
  return sendMessage('pri(accounts.crossChainTransfer)', request);
}

export async function transferCheckReferenceCount (request: RequestTransferCheckReferenceCount): Promise<boolean> {
  return sendMessage('pri(transfer.checkReferenceCount)', request);
}

export async function transferCheckSupporting (request: RequestTransferCheckSupporting): Promise<SupportTransferResponse> {
  return sendMessage('pri(transfer.checkSupporting)', request);
}

export async function transferGetExistentialDeposit (request: RequestTransferExistentialDeposit): Promise<string> {
  return sendMessage('pri(transfer.getExistentialDeposit)', request);
}

export async function getMaxTransfer (request: RequestMaxTransferable): Promise<AmountData> {
  return sendMessage('pri(transfer.getMaxTransferable)', request);
}
