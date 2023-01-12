// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ERC20_ABI, _ERC721_ABI } from '@subwallet/extension-base/services/chain-service/helper';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

export const getERC20Contract = (networkKey: string, assetAddress: string, evmApiMap: Record<string, _EvmApi>, options = {}): Contract => {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return new evmApiMap[networkKey].api.eth.Contract(_ERC20_ABI, assetAddress, options);
};

export const getERC721Contract = (networkKey: string, assetAddress: string, web3ApiMap: Record<string, Web3>, options = {}): Contract => {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return new web3ApiMap[networkKey].eth.Contract(_ERC721_ABI, assetAddress, options);
};
