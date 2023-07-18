// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { BalanceErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { detectTranslate } from '@subwallet/extension-base/utils';

// Todo: finish this map in the future
const defaultErrorMap: Record<BalanceErrorType, { message: string, code?: number }> = {
  [BalanceErrorType.NETWORK_ERROR]: {
    message: detectTranslate('Chain is inactive or disconnected'),
    code: undefined
  },
  [BalanceErrorType.TOKEN_ERROR]: {
    message: detectTranslate('Token is not supported'),
    code: undefined
  },
  [BalanceErrorType.TIMEOUT]: {
    message: detectTranslate('Get balance timeout'),
    code: undefined
  },
  [BalanceErrorType.GET_BALANCE_ERROR]: {
    message: detectTranslate('Get balance error'),
    code: undefined
  }
};

export class BalanceError extends SWError {
  override errorType: BalanceErrorType;

  constructor (errorType: BalanceErrorType, errMessage?: string, data?: unknown) {
    const defaultErr = defaultErrorMap[errorType];
    const message = errMessage || defaultErr?.message || errorType;

    super(errorType, message, defaultErr?.code, data);
    this.errorType = errorType;
  }
}
