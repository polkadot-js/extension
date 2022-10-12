// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, CustomToken, CustomTokenJson, CustomTokenType } from '@subwallet/extension-base/background/KoniTypes';
import { validateEvmToken } from '@subwallet/extension-koni-base/api/tokens/evm/utils';
import { validateWasmToken } from '@subwallet/extension-koni-base/api/tokens/wasm/utils';
import Web3 from 'web3';

import { isEthereumAddress } from '@polkadot/util-crypto';

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

export interface UpsertCustomTokenResp {
  needUpdateChainRegistry: boolean,
  newCustomTokenState: CustomTokenJson
}

export function isEqualContractAddress (address1: string, address2: string) {
  if (isEthereumAddress(address1) && isEthereumAddress(address2)) {
    return address1.toLowerCase() === address2.toLowerCase(); // EVM address is case-insensitive
  }

  return address2 === address1;
}

export function upsertCustomToken (targetToken: CustomToken, customTokenState: CustomTokenJson): UpsertCustomTokenResp {
  let isExisted = false;
  const tokenList = customTokenState[targetToken.type];
  let newTokenList = tokenList;

  for (const token of tokenList) {
    if (isEqualContractAddress(token.smartContract, targetToken.smartContract) && token.chain === targetToken.chain) {
      isExisted = true;
      break;
    }
  }

  if (!isExisted) {
    newTokenList.push(targetToken);
  } else {
    newTokenList = tokenList.map((token) => {
      if (isEqualContractAddress(token.smartContract, targetToken.smartContract)) {
        if (token.isDeleted) {
          return {
            name: token.name,
            smartContract: token.smartContract,
            chain: token.chain,
            type: token.type
          };
        }

        return targetToken;
      }

      return token;
    });
  }

  const needUpdateChainRegistry = targetToken.type === CustomTokenType.erc20 || targetToken.type === CustomTokenType.psp22; // more logic when there are more standards

  return {
    newCustomTokenState: { ...customTokenState, [targetToken.type]: newTokenList },
    needUpdateChainRegistry
  } as UpsertCustomTokenResp;
}

export const FUNGIBLE_TOKEN_STANDARDS = [
  CustomTokenType.erc20,
  CustomTokenType.psp22
];

export function getTokensForChainRegistry (customTokenJson: CustomTokenJson) {
  const customTokens: CustomToken[] = [];

  for (const tokenType of FUNGIBLE_TOKEN_STANDARDS) {
    customTokenJson[tokenType].forEach((token) => {
      if (!token.isDeleted) {
        customTokens.push(token);
      }
    });
  }

  return customTokens;
}
