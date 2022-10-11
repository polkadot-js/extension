// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomTokenJson, CustomTokenType, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { DEFAULT_EVM_TOKENS } from '@subwallet/extension-koni-base/api/tokens/evm/defaultEvmToken';
import { ERC20Contract, ERC721Contract } from '@subwallet/extension-koni-base/api/tokens/evm/web3';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

export async function validateEvmToken (contractAddress: string, tokenType: CustomTokenType.erc20 | CustomTokenType.erc721, web3: Web3) {
  let tokenContract: Contract;
  let name = '';
  let decimals: number | undefined = -1;
  let symbol = '';

  if (tokenType === CustomTokenType.erc721) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
    tokenContract = new web3.eth.Contract(ERC721Contract.abi, contractAddress);

    const [_name, _symbol] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      tokenContract.methods.name().call() as string,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      tokenContract.methods.symbol().call() as string
    ]);

    name = _name;
    symbol = _symbol;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
    tokenContract = new web3.eth.Contract(ERC20Contract.abi, contractAddress);

    const [_name, _decimals, _symbol] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      tokenContract.methods.name().call() as string,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      tokenContract.methods.decimals().call() as number,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      tokenContract.methods.symbol().call() as string
    ]);

    name = _name;
    decimals = _decimals;
    symbol = _symbol;
  }

  return {
    name,
    decimals,
    symbol
  };
}

export function initEvmTokenState (customTokenState: CustomTokenJson, networkMap: Record<string, NetworkJson>) {
  const evmTokenState = { erc20: customTokenState.erc20, erc721: customTokenState.erc721 };

  for (const defaultToken of DEFAULT_EVM_TOKENS.erc20) {
    let exist = false;

    for (const storedToken of evmTokenState.erc20) {
      if (defaultToken.smartContract.toLowerCase() === storedToken.smartContract.toLowerCase() && defaultToken.chain === storedToken.chain) {
        if (storedToken.isCustom) {
          // if existed, migrate the custom token -> default token
          delete storedToken.isCustom;
        }

        exist = true;
        break;
      }
    }

    if (!exist) {
      evmTokenState.erc20.push(defaultToken);
    }
  }

  for (const defaultToken of DEFAULT_EVM_TOKENS.erc721) {
    let exist = false;

    for (const storedToken of evmTokenState.erc721) {
      if (defaultToken.smartContract.toLowerCase() === storedToken.smartContract.toLowerCase() && defaultToken.chain === storedToken.chain) {
        if (storedToken.isCustom) {
          // if existed custom token before, migrate the custom token -> default token
          delete storedToken.isCustom;
        }

        exist = true;
        break;
      }
    }

    if (!exist) {
      evmTokenState.erc721.push(defaultToken);
    }
  }

  // Update networkKey in case networkMap change
  for (const token of evmTokenState.erc20) {
    if (!(token.chain in networkMap) && token.chain.startsWith('custom_')) {
      let newKey = '';
      const genesisHash = token.chain.split('custom_')[1]; // token from custom network has key with prefix custom_

      for (const [key, network] of Object.entries(networkMap)) {
        if (network.genesisHash.toLowerCase() === genesisHash.toLowerCase()) {
          newKey = key;
          break;
        }
      }

      token.chain = newKey;
    }
  }

  for (const token of evmTokenState.erc721) {
    if (!(token.chain in networkMap) && token.chain.startsWith('custom_')) {
      let newKey = '';
      const genesisHash = token.chain.split('custom_')[1]; // token from custom network has key with prefix custom_

      for (const [key, network] of Object.entries(networkMap)) {
        if (network.genesisHash.toLowerCase() === genesisHash.toLowerCase()) {
          newKey = key;
          break;
        }
      }

      token.chain = newKey;
    }
  }

  return evmTokenState;
}
