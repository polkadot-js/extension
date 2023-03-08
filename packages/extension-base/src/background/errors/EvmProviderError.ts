// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { EvmProviderErrorType } from '@subwallet/extension-base/background/KoniTypes';

const EVM_PROVIDER_RPC_ERRORS_MAP = {
  [EvmProviderErrorType.USER_REJECTED_REQUEST]: [4001, 'User Rejected Request'],
  [EvmProviderErrorType.UNAUTHORIZED]: [4100, 'Unauthorized'],
  [EvmProviderErrorType.UNSUPPORTED_METHOD]: [4200, 'Unsupported Method'],
  [EvmProviderErrorType.DISCONNECTED]: [4900, 'Disconnected'],
  [EvmProviderErrorType.CHAIN_DISCONNECTED]: [4901, 'Chain Disconnected'],
  [EvmProviderErrorType.INVALID_PARAMS]: [-32602, 'Invalid Params'],
  [EvmProviderErrorType.INTERNAL_ERROR]: [-32603, 'Internal Error']
} as Record<EvmProviderErrorType, [number, string]>;

export class EvmProviderError extends SWError {
  override errorType: EvmProviderErrorType;

  constructor (errorType: EvmProviderErrorType, message?: string, data?: unknown) {
    const [code, prefix] = EVM_PROVIDER_RPC_ERRORS_MAP[errorType];
    const errMessage = message ? `${prefix}: ${message}` : prefix;

    super(errorType, errMessage, code, data);
    this.errorType = errorType;
  }
}
