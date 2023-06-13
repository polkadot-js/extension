// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { getWasmContractGasLimit } from '@subwallet/extension-base/koni/api/tokens/wasm/utils';
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

const mustFormatNumberReg = /^-?[0-9][0-9,.]+$/;

export async function getPSP34TransferExtrinsic (networkKey: string, substrateApi: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  const contractAddress = params.contractAddress as string;
  const onChainOption = params.onChainOption as Record<string, string>;

  for (const [key, value] of Object.entries(onChainOption)) {
    if (mustFormatNumberReg.test(value)) {
      onChainOption[key] = value.replaceAll(',', '');
    }
  }

  try {
    const contractPromise = getPSP34ContractPromise(substrateApi.api, contractAddress);
    // @ts-ignore
    const gasLimit = await getWasmContractGasLimit(substrateApi.api, senderAddress, 'psp34::transfer', contractPromise, {}, [recipientAddress, onChainOption, {}]);

    // @ts-ignore
    return contractPromise.tx['psp34::transfer']({ gasLimit }, recipientAddress, onChainOption, {});
  } catch (e) {
    console.debug(e);

    return null;
  }
}
