// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmProviderRpcErrorInterface, EvmRpcErrorHelperMap } from '@subwallet/extension-base/background/KoniTypes';
import { EVM_PROVIDER_RPC_ERRORS_MAP } from '@subwallet/extension-koni-base/constants';

export class EvmRpcError extends Error implements EvmProviderRpcErrorInterface {
  code: number;
  data: unknown;
  override message: string;

  constructor (type: keyof EvmRpcErrorHelperMap, message?: string, data?: unknown) {
    const [code, prefix] = EVM_PROVIDER_RPC_ERRORS_MAP[type];
    const finalMessage = message ? `${prefix}: ${message}` : prefix;

    super(finalMessage);

    this.code = code;
    this.message = finalMessage;
    this.data = data;
  }
}
