// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { TransactionErrorType } from '@subwallet/extension-base/background/KoniTypes';

// Todo: finish this map in the future
const codeMap = {} as Record<TransactionErrorType, number>;

export class TransactionError extends SWError {
  override errorType: TransactionErrorType;

  constructor (errorType: TransactionErrorType, message: string, data?: unknown) {
    super(errorType, message, codeMap[errorType], data);
    this.errorType = errorType;
  }
}
