// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomTokenType } from '@subwallet/extension-base/background/KoniTypes';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const ERC20Contract = require('./helper/ERC20Contract.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const ERC721Contract = require('./helper/ERC721Contract.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const TestERC721Contract = require('./helper/TestERC721Contract.json');

export const getERC20Contract = (networkKey: string, assetAddress: string, web3ApiMap: Record<string, Web3>, options = {}): Contract => {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return new web3ApiMap[networkKey].eth.Contract(ERC20Contract.abi, assetAddress, options);
};

export const initWeb3Api = (provider: string) => {
  if (provider.startsWith('http')) {
    return new Web3(new Web3.providers.HttpProvider(provider));
  } else {
    return new Web3(new Web3.providers.WebsocketProvider(provider));
  }
};

export const getERC721Contract = (networkKey: string, assetAddress: string, web3ApiMap: Record<string, Web3>, options = {}): Contract => {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return new web3ApiMap[networkKey].eth.Contract(ERC721Contract, assetAddress, options);
};

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
