// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { ProviderErrorType } from '@subwallet/extension-base/background/KoniTypes';

const defaultErrorMap: Record<ProviderErrorType, { message: string, code?: number }> = {
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
  USER_REJECT: {
    message: 'User reject request',
    code: undefined
  }
};

export class ProviderError extends SWError {
  override errorType: ProviderErrorType;

  constructor (errorType: ProviderErrorType, errMessage?: string, data?: unknown) {
    const { code, message } = defaultErrorMap[errorType];

    super(errorType, errMessage || message, code, data);

    this.errorType = errorType;
  }
}
