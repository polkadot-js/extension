// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { ProviderErrorType } from '@subwallet/extension-base/background/KoniTypes';

// Todo: finish this map in the future
const codeMap = {} as Record<ProviderErrorType, number>;

export class ProviderError extends SWError {
  override errorType: ProviderErrorType;

  constructor (errorType: ProviderErrorType, message: string, data?: unknown) {
    super(errorType, message, codeMap[errorType], data);

    this.errorType = errorType;
  }
}
