// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { BasicTxErrorType, StakingTxErrorType, TransactionErrorType, TransferTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { detectTranslate } from '@subwallet/extension-base/utils';

// Todo: finish this map in the future
const defaultErrorMap = {
  NOT_ENOUGH_BALANCE: {
    message: detectTranslate('Not enough balance'),
    code: undefined
  },
  CHAIN_DISCONNECTED: {
    message: detectTranslate('Chain is disconnected'),
    code: undefined
  },
  INVALID_PARAMS: {
    message: detectTranslate('Invalid params'),
    code: undefined
  },
  INTERNAL_ERROR: {
    message: detectTranslate('Internal error'),
    code: undefined
  },
  DUPLICATE_TRANSACTION: {
    message: detectTranslate('Duplicate transaction'),
    code: undefined
  },
  UNABLE_TO_SIGN: {
    message: detectTranslate('Unable to sign'),
    code: undefined
  },
  USER_REJECT_REQUEST: {
    message: detectTranslate('User reject request'),
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
    message: detectTranslate('Exist unstaking request'),
    code: undefined
  },
  [StakingTxErrorType.INVALID_ACTIVE_STAKE]: {
    message: detectTranslate('Invalid active stake'),
    code: undefined
  },
  [StakingTxErrorType.EXCEED_MAX_UNSTAKING]: {
    message: detectTranslate('Exceed max unstaking'),
    code: undefined
  },
  [StakingTxErrorType.INACTIVE_NOMINATION_POOL]: {
    message: detectTranslate('This nomination pool is not active'),
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
