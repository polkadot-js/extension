// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { EvmProviderErrorType } from '@subwallet/extension-base/background/KoniTypes';

const defaultErrorMap: Record<EvmProviderErrorType, { message: string, code?: number }> = {
  USER_REJECTED_REQUEST: {
    message: 'User Rejected Request',
    code: 4001
  },
  UNAUTHORIZED: {
    message: 'Unauthorized',
    code: 4100
  },
  UNSUPPORTED_METHOD: {
    message: 'Unsupported Method',
    code: 4200
  },
  DISCONNECTED: {
    message: 'Disconnected',
    code: 4900
  },
  CHAIN_DISCONNECTED: {
    message: 'Chain Disconnected',
    code: 4901
  },
  INVALID_PARAMS: {
    message: 'Invalid Params',
    code: -32602
  },
  INTERNAL_ERROR: {
    message: 'Internal Error',
    code: -32603
  }
};

export class EvmProviderError extends SWError {
  override errorType: EvmProviderErrorType;

  constructor (errorType: EvmProviderErrorType, errMessage?: string, data?: unknown) {
    const { code, message } = defaultErrorMap[errorType];
    const finalMessage = errMessage ? `${message}: ${errMessage}` : message;

    super(errorType, finalMessage, code, data);
    this.errorType = errorType;
  }
}
