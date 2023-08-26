// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { BalanceErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { detectTranslate } from '@subwallet/extension-base/utils';
import { t } from 'i18next';

// Todo: finish this map in the future
const defaultErrorMap: Record<BalanceErrorType, { message: string, code?: number }> = {
  [BalanceErrorType.NETWORK_ERROR]: {
    message: detectTranslate('Network is inactive. Please enable network'),
    code: undefined
  },
  [BalanceErrorType.TOKEN_ERROR]: {
    message: detectTranslate('Token is not supported'),
    code: undefined
  },
  [BalanceErrorType.TIMEOUT]: {
    message: detectTranslate('Unable to get balance. Please re-enable the network'),
    code: undefined
  },
  [BalanceErrorType.GET_BALANCE_ERROR]: {
    message: detectTranslate('Unable to get balance. Please re-enable the network'),
    code: undefined
  }
};

export class BalanceError extends SWError {
  override errorType: BalanceErrorType;

  constructor (errorType: BalanceErrorType, errMessage?: string, data?: unknown) {
    const defaultErr = defaultErrorMap[errorType];
    const message = errMessage || t(defaultErr?.message || '') || errorType;

    super(errorType, message, defaultErr?.code, data);
    this.errorType = errorType;
  }
}
