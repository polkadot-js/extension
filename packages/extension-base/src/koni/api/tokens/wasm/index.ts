// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _PSP22_ABI, _PSP34_ABI } from '@subwallet/extension-base/services/chain-service/helper';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';

export function getPSP22ContractPromise (apiPromise: ApiPromise, contractAddress: string) {
  return new ContractPromise(apiPromise, _PSP22_ABI, contractAddress);
}

export function getPSP34ContractPromise (apiPromise: ApiPromise, contractAddress: string) {
  return new ContractPromise(apiPromise, _PSP34_ABI, contractAddress);
}

export async function getPSP34TransferExtrinsic (networkKey: string, substrateApi: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  const contractAddress = params.contractAddress as string;
  const onChainOption = params.onChainOption as Record<string, string>;

  try {
    const contractPromise = getPSP34ContractPromise(substrateApi.api, contractAddress);
    const transferQuery = await contractPromise.query['psp34::transfer'](senderAddress, { gasLimit: -1 }, recipientAddress, onChainOption, {});

    const gasLimit = transferQuery.gasRequired.toString();

    return contractPromise.tx['psp34::transfer']({ gasLimit }, recipientAddress, onChainOption, {});
  } catch (e) {
    console.error('Error getting WASM NFT transfer extrinsic', e);

    return null;
  }
}