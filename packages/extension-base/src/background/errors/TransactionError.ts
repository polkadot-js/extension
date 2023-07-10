// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { BasicTxErrorType, StakingTxErrorType, TransactionErrorType, TransferTxErrorType } from '@subwallet/extension-base/background/KoniTypes';

// Todo: finish this map in the future
const defaultErrorMap = {
  NOT_ENOUGH_BALANCE: {
    message: 'Not enough balance',
    code: undefined
  },
  CHAIN_DISCONNECTED: {
    message: 'Chain is disconnected',
    code: undefined
  },
  INVALID_PARAMS: {
    message: 'Invalid params',
    code: undefined
  },
  INTERNAL_ERROR: {
    message: 'Internal error',
    code: undefined
  },
  DUPLICATE_TRANSACTION: {
    message: 'Duplicate transaction',
    code: undefined
  },
  UNABLE_TO_SIGN: {
    message: 'Unable to sign',
    code: undefined
  },
  USER_REJECT_REQUEST: {
    message: 'User reject request',
    code: undefined
  },
  UNABLE_TO_SEND: {
    message: 'Unable to send',
    code: undefined
  },
  SEND_TRANSACTION_FAILED: {
    message: 'Send transaction failed',
    code: undefined
  },
  NOT_ENOUGH_EXISTENTIAL_DEPOSIT: {
    message: 'Not enough existential deposit',
    code: undefined
  },
  [BasicTxErrorType.UNSUPPORTED]: {
    message: 'This transaction is not supported',
    code: undefined
  },
  [BasicTxErrorType.TIMEOUT]: {
    message: 'Transaction timeout',
    code: undefined
  },
  [StakingTxErrorType.NOT_ENOUGH_MIN_STAKE]: {
    message: 'Not enough min stake',
    code: undefined
  },
  [StakingTxErrorType.EXCEED_MAX_NOMINATIONS]: {
    message: 'Exceed max nominations',
    code: undefined
  },
  [StakingTxErrorType.EXIST_UNSTAKING_REQUEST]: {
    message: 'Exist unstaking request',
    code: undefined
  },
  [StakingTxErrorType.INVALID_ACTIVE_STAKE]: {
    message: 'Invalid active stake',
    code: undefined
  },
  [StakingTxErrorType.EXCEED_MAX_UNSTAKING]: {
    message: 'Exceed max unstaking',
    code: undefined
  },
  [StakingTxErrorType.INACTIVE_NOMINATION_POOL]: {
    message: 'This nomination pool is not active',
    code: undefined
  },
  [TransferTxErrorType.RECEIVER_NOT_ENOUGH_EXISTENTIAL_DEPOSIT]: {
    message: 'Receiver is not enough existential deposit',
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
