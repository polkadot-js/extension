// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { SwapErrorType } from '@subwallet/extension-base/types/swap';
import { detectTranslate } from '@subwallet/extension-base/utils';

const defaultErrorMap: Record<SwapErrorType, { message: string, code?: number }> = {
  ERROR_FETCHING_QUOTE: {
    message: detectTranslate('Cannot find suitable quote'),
    code: undefined
  },
  NOT_MEET_MIN_SWAP: {
    message: detectTranslate('Not enough min swap'),
    code: undefined
  },
  EXCEED_MAX_SWAP: {
    message: detectTranslate('Amount exceeds max swap'),
    code: undefined
  },
  QUOTE_TIMEOUT: {
    message: detectTranslate('Quote timeout'),
    code: undefined
  },
  NO_AVAILABLE_PROVIDER: {
    message: detectTranslate('No available provider'),
    code: undefined
  },
  UNKNOWN: {
    message: detectTranslate('Unknown'),
    code: undefined
  },
  ASSET_NOT_SUPPORTED: {
    message: detectTranslate('Asset not supported'),
    code: undefined
  },
  INVALID_RECIPIENT: {
    message: detectTranslate('Invalid recipient'),
    code: undefined
  }
};

export class SwapError extends SWError {
  override errorType: SwapErrorType;

  constructor (errorType: SwapErrorType, errMessage?: string, data?: unknown) {
    const { code, message } = defaultErrorMap[errorType];

    super(errorType, errMessage || message, code, data);

    this.errorType = errorType;
  }
}
