// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { BasicTxErrorType, StakingTxErrorType, TransactionErrorType, TransferTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { detectTranslate } from '@subwallet/extension-base/utils';

// Todo: finish this map in the future
const defaultErrorMap = {
  NOT_ENOUGH_BALANCE: {
    message: detectTranslate('Insufficient balance'),
    code: undefined
  },
  CHAIN_DISCONNECTED: {
    message: detectTranslate('Network is disconnected'),
    code: undefined
  },
  INVALID_PARAMS: {
    message: detectTranslate('Undefined error. Please contact SubWallet support'),
    code: undefined
  },
  INTERNAL_ERROR: {
    message: detectTranslate('Undefined error. Please contact SubWallet support'),
    code: undefined
  },
  DUPLICATE_TRANSACTION: {
    message: detectTranslate('Another transaction is in queue. Please try again later'),
    code: undefined
  },
  UNABLE_TO_SIGN: {
    message: detectTranslate('Unable to sign'),
    code: undefined
  },
  USER_REJECT_REQUEST: {
    message: detectTranslate('Rejected by user'),
    code: undefined
  },
  UNABLE_TO_SEND: {
    message: detectTranslate('Unable to send'),
    code: undefined
  },
  SEND_TRANSACTION_FAILED: {
    message: detectTranslate('Send transaction failed'),
    code: undefined
  },
  NOT_ENOUGH_EXISTENTIAL_DEPOSIT: {
    message: detectTranslate('Insufficient balance to cover existential deposit. Please decrease the transaction amount or increase your current balance'),
    code: undefined
  },
  [BasicTxErrorType.UNSUPPORTED]: {
    message: detectTranslate('This transaction is not supported'),
    code: undefined
  },
  [BasicTxErrorType.TIMEOUT]: {
    message: detectTranslate('Transaction timeout'),
    code: undefined
  },
  [StakingTxErrorType.NOT_ENOUGH_MIN_STAKE]: {
    message: detectTranslate('Not enough min stake'),
    code: undefined
  },
  [StakingTxErrorType.EXCEED_MAX_NOMINATIONS]: {
    message: detectTranslate('Exceed max nominations'),
    code: undefined
  },
  [StakingTxErrorType.EXIST_UNSTAKING_REQUEST]: {
    message: detectTranslate('You can unstake from a collator once'),
    code: undefined
  },
  [StakingTxErrorType.INVALID_ACTIVE_STAKE]: {
    message: detectTranslate('Invalid. If you unstake this amount your active stake would fall below minimum active threshold'),
    code: undefined
  },
  [StakingTxErrorType.EXCEED_MAX_UNSTAKING]: {
    message: detectTranslate('Exceed max unstaking'),
    code: undefined
  },
  [StakingTxErrorType.INACTIVE_NOMINATION_POOL]: {
    message: detectTranslate('Invalid. Inactive nomination pool'),
    code: undefined
  },
  [TransferTxErrorType.RECEIVER_NOT_ENOUGH_EXISTENTIAL_DEPOSIT]: {
    message: detectTranslate('Receiver is not enough existential deposit'),
    code: undefined
  }
} as Record<TransactionErrorType, { message: string, code?: number }>;

export class TransactionError extends SWError {
  override errorType: TransactionErrorType;

  constructor (errorType: TransactionErrorType, errMessage?: string, data?: unknown) {
    const defaultErr = defaultErrorMap[errorType];
    const message = errMessage || defaultErr?.message || errorType;

    super(errorType, message, defaultErr?.code, data);
    this.errorType = errorType;
  }
}
