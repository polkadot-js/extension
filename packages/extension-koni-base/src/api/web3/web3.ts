// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EVM_NETWORKS } from '@subwallet/extension-koni-base/api/endpoints';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const ERC20Contract = require('./api-helper/ERC20Contract.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const ERC721Contract = require('./api-helper/ERC721Contract.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const TestERC721Contract = require('./api-helper/TestERC721Contract.json');

// export const connectWeb3Apis = (networks = EVM_NETWORKS): Record<string, Web3> => {
//   const apiMap = {} as Record<string, Web3>;
//
//   Object.entries(networks).forEach(([networkKey, networkInfo]) => {
//     if (networkInfo && networkInfo.provider) {
//       if (networkInfo.provider.startsWith('ws')) {
//         apiMap[networkKey] = new Web3(new Web3.providers.WebsocketProvider(networkInfo.provider));
//       } else if (networkInfo.provider.startsWith('http')) {
//         apiMap[networkKey] = new Web3(new Web3.providers.HttpProvider(networkInfo.provider));
//       }
//     }
//   });
//
//   return apiMap;
// };

// export const web3Map = connectWeb3Apis();
//
// export const getWeb3Api = (networkKey: string) => {
//   return web3Map[networkKey];
// };

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
