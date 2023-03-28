// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomToken, CustomTokenType } from '@subwallet/extension-base/background/KoniTypes';

interface WasmTokenJson {
  psp22: CustomToken[],
  psp34: CustomToken[]
}

export const DEFAULT_WASM_TOKENS: WasmTokenJson = {
  psp22: [
    {
      name: 'PANX',
      smartContract: '5DGHdeY4SXsZ2w8RZrgXXJwHXXe2Qg8LCnUoDTr3tnBnu2BC',
      chain: 'alephTest',
      symbol: 'PANX',
      decimals: 10,
      type: CustomTokenType.psp22,
      isCustom: true
    }
  ],
  psp34: [
    {
      name: 'AFRICA’S POLKADOT EVENT',
      smartContract: '5CPwou5girStP4ALMF2GMAU1tRkDHt2qmm5pi6zmxTHUntCM',
      chain: 'alephTest',
      type: CustomTokenType.psp34
    }
  ]
};
