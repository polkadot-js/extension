// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, CustomTokenType } from '@subwallet/extension-base/background/KoniTypes';
import { validateEvmToken } from '@subwallet/extension-koni-base/api/tokens/evm/web3';
import Web3 from 'web3';

export async function validateCustomToken (contractAddress: string, tokenType: CustomTokenType, web3: Web3 | undefined, apiProps: ApiProps | undefined) {
  if ((tokenType === CustomTokenType.erc20 || tokenType === CustomTokenType.erc721) && web3 !== undefined) {
    return await validateEvmToken(contractAddress, tokenType, web3);
  } else if ((tokenType === CustomTokenType.psp22 || tokenType === CustomTokenType.psp34) && apiProps !== undefined) {
    // TODO: validate psp22 and psp34

    return { decimals: 12, symbol: 'TEST', name: 'tokenTest' };
  }

  return {
    name: '',
    decimals: -1,
    symbol: ''
  };
}
