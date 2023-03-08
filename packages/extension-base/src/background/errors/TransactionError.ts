// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { TransactionErrorType } from '@subwallet/extension-base/background/KoniTypes';

// Todo: finish this map in the future
const defaultErrorMap: Record<TransactionErrorType, { message: string, code?: number }> = {
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
  }
};

export class TransactionError extends SWError {
  override errorType: TransactionErrorType;

  constructor (errorType: TransactionErrorType, errMessage?: string, data?: unknown) {
    const { code, message } = defaultErrorMap[errorType];

    super(errorType, errMessage || message, code, data);
    this.errorType = errorType;
  }
}
