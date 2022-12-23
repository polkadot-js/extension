// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, ChainRegistry, CustomToken, CustomTokenJson, CustomTokenType, DeleteCustomTokenParams } from '@subwallet/extension-base/background/KoniTypes';
import { validateEvmToken } from '@subwallet/extension-koni-base/api/tokens/evm/utils';
import { validateWasmToken } from '@subwallet/extension-koni-base/api/tokens/wasm/utils';
import Web3 from 'web3';

import { isEthereumAddress } from '@polkadot/util-crypto';

export async function validateCustomToken (contractAddress: string, tokenType: CustomTokenType, web3: Web3 | undefined, apiProps: ApiProps | undefined, contractCaller?: string) {
  if ((tokenType === CustomTokenType.erc20 || tokenType === CustomTokenType.erc721) && web3 !== undefined) {
    return await validateEvmToken(contractAddress, tokenType, web3);
  } else if ((tokenType === CustomTokenType.psp22 || tokenType === CustomTokenType.psp34) && apiProps !== undefined) {
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
    if (isEqualContractAddress(token.contractAddress, targetToken.contractAddress) && token.chain === targetToken.chain) {
      isExisted = true;
      break;
    }
  }

  if (!isExisted) {
    newTokenList.push(targetToken);
  } else {
    newTokenList = tokenList.map((token) => {
      if (isEqualContractAddress(token.contractAddress, targetToken.contractAddress)) {
        if (token.isDeleted) {
          return {
            name: token.name,
            contractAddress: token.contractAddress,
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

export function deleteCustomTokens (targetTokens: DeleteCustomTokenParams[], customTokenState: CustomTokenJson, chainRegistryMap: Record<string, ChainRegistry>) {
  let needUpdateChainRegistry = false;
  const deletedNfts: DeleteCustomTokenParams[] = [];
  const deletedFungibleTokens: DeleteCustomTokenParams[] = [];

  // handle token state
  for (const targetToken of targetTokens) {
    const tokenList = customTokenState[targetToken.type];
    let processed = false;

    for (let index = 0; index < tokenList.length; index++) {
      if (isEqualContractAddress(tokenList[index].contractAddress, targetToken.contractAddress) &&
        tokenList[index].chain === targetToken.chain &&
        tokenList[index].type === targetToken.type) {
        if (tokenList[index].isCustom) {
          tokenList.splice(index, 1);
        } else {
          tokenList[index].isDeleted = true;
        }

        processed = true;
      }
    }

    if (processed) {
      if (FUNGIBLE_TOKEN_STANDARDS.includes(targetToken.type)) {
        needUpdateChainRegistry = true;
        deletedFungibleTokens.push(targetToken);
      } else {
        deletedNfts.push(targetToken);
      }
    }
  }

  // update chain registry
  if (needUpdateChainRegistry) {
    for (const targetToken of deletedFungibleTokens) {
      const chainRegistry = chainRegistryMap[targetToken.chain];

      if (chainRegistry) {
        let deleteKey = '';

        for (const [key, token] of Object.entries(chainRegistry.tokenMap)) {
          if (token.contractAddress && isEqualContractAddress(token.contractAddress, targetToken.contractAddress) && token.type === targetToken.type) {
            deleteKey = key;
            break;
          }
        }

        delete chainRegistry.tokenMap[deleteKey];
        chainRegistryMap[targetToken.chain] = chainRegistry;
      }
    }
  }

  return {
    newCustomTokenState: customTokenState,
    newChainRegistryMap: chainRegistryMap,
    deletedNfts
  };
}
