// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { SwapErrorType } from '@subwallet/extension-base/types/swap';
import { detectTranslate } from '@subwallet/extension-base/utils';

const defaultErrorMap: Record<SwapErrorType, { message: string, code?: number }> = {
  ERROR_FETCHING_QUOTE: {
    message: detectTranslate('No swap quote found. Adjust your amount or try again later'),
    code: undefined
  },
  NOT_MEET_MIN_SWAP: {
    message: detectTranslate('Amount too low. Increase your amount and try again'),
    code: undefined
  },
  QUOTE_TIMEOUT: {
    message: detectTranslate('Quote timeout'),
    code: undefined
  },
  UNKNOWN: {
    message: detectTranslate('Undefined error. Check your Internet connection or contact support'),
    code: undefined
  },
  ASSET_NOT_SUPPORTED: {
    message: detectTranslate('This swap pair is not supported'),
    code: undefined
  },
  INVALID_RECIPIENT: {
    message: detectTranslate('Invalid recipient'),
    code: undefined
  },
  SWAP_EXCEED_ALLOWANCE: {
    message: detectTranslate('You cannot swap all your balance. Lower your amount and try again'),
    code: undefined
  },
  SWAP_NOT_ENOUGH_BALANCE: {
    message: detectTranslate('You must deposit more funds to swap'),
    code: undefined
  },
  NOT_ENOUGH_LIQUIDITY: {
    message: detectTranslate('There is not enough liquidity to complete the swap. Lower your amount and try again'),
    code: undefined
  },
  AMOUNT_CANNOT_BE_ZERO: {
    message: detectTranslate('Amount must be greater than 0'),
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
