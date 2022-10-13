// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomToken } from '@subwallet/extension-base/background/KoniTypes';

interface WasmTokenJson {
  psp22: CustomToken[],
  psp34: CustomToken[]
}

export const DEFAULT_WASM_TOKENS: WasmTokenJson = {
  psp22: [],
  psp34: []
  // psp22: [
  //   {
  //     name: 'PANX',
  //     smartContract: '5CY8zDBjUDNwZBHdGbERtLLSZqY7dJYsm1KhY6tSorYvnSke',
  //     chain: 'alephTest',
  //     symbol: 'PANX',
  //     decimals: 12,
  //     type: CustomTokenType.psp22,
  //     isCustom: true
  //   }
  // ],
  // psp34: [
  //   {
  //     name: 'Frog Collection',
  //     smartContract: '5EQXQ5E1NfU6Znm3avpZM7mArxZDwQeugJG3pFNADU6Pygfw',
  //     chain: 'alephTest',
  //     type: CustomTokenType.psp34
  //   }
  // ]
};
