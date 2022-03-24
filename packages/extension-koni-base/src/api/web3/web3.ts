// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

import { EVM_NETWORKS } from '@polkadot/extension-koni-base/api/endpoints';

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const ERC20Contract = require('./api-helper/ERC20Contract.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const ERC721Contract = require('./api-helper/ERC721Contract.json');

export const connectWeb3Apis = (networks = EVM_NETWORKS): Record<string, Web3> => {
  const apiMap = {} as Record<string, Web3>;

  Object.entries(networks).forEach(([networkKey, networkInfo]) => {
    if (networkInfo && networkInfo.provider) {
      apiMap[networkKey] = new Web3(new Web3.providers.WebsocketProvider(networkInfo.provider));
    }
  });

  return apiMap;
};

export const web3Map = connectWeb3Apis();

export const getWeb3Api = (networkKey: string) => {
  return web3Map[networkKey];
};

export const getERC20Contract = (networkKey: string, assetAddress: string, options = {}): Contract => {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return new web3Map[networkKey].eth.Contract(ERC20Contract.abi, assetAddress, options);
};
