// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomTokenJson } from '@subwallet/extension-base/background/KoniTypes';
import { DEFAULT_EVM_TOKENS } from '@subwallet/extension-koni-base/api/tokens/evm/defaultEvmToken';
import { DEFAULT_WASM_TOKENS } from '@subwallet/extension-koni-base/api/tokens/wasm/defaultWasmToken';

export const DEFAULT_SUPPORTED_TOKENS: CustomTokenJson = {
  ...DEFAULT_EVM_TOKENS,
  ...DEFAULT_WASM_TOKENS
};
