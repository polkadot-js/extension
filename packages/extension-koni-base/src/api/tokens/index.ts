// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, CustomTokenType } from '@subwallet/extension-base/background/KoniTypes';
import { validateEvmToken } from '@subwallet/extension-koni-base/api/tokens/evm/utils';
import { validateWasmToken } from '@subwallet/extension-koni-base/api/tokens/wasm/utils';
import Web3 from 'web3';

export async function validateCustomToken (contractAddress: string, tokenType: CustomTokenType, web3: Web3 | undefined, apiProps: ApiProps | undefined, contractCaller?: string) {
  if ((tokenType === CustomTokenType.erc20 || tokenType === CustomTokenType.erc721) && web3 !== undefined) {
    return await validateEvmToken(contractAddress, tokenType, web3);
  } else if ((tokenType === CustomTokenType.psp22 || tokenType === CustomTokenType.psp34) && apiProps !== undefined && contractCaller) {
    return await validateWasmToken(contractAddress, tokenType, apiProps.api, contractCaller);
  }

  return {
    name: '',
    decimals: -1,
    symbol: '',
    contractError: true
  };
}
