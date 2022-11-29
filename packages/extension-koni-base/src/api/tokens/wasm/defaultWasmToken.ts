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
      smartContract: '5CY8zDBjUDNwZBHdGbERtLLSZqY7dJYsm1KhY6tSorYvnSke',
      chain: 'alephTest',
      symbol: 'PANX',
      decimals: 12,
      type: CustomTokenType.psp22,
      isCustom: true
    }
  ],
  psp34: [
    {
      name: 'Praying Mantis Predators',
      smartContract: '5Hg1xe6JAGZj92wxtj1ykAfQpwwRNqzAnvhZ3TuXZEmLU1Vw',
      chain: 'alephTest',
      type: CustomTokenType.psp34
    }
  ]
};
