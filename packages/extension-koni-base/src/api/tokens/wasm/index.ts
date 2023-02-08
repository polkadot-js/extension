// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { SubstrateNftTransaction } from '@subwallet/extension-base/background/KoniTypes';
import { _PSP22_ABI, _PSP34_ABI } from '@subwallet/extension-base/services/chain-service/helper';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { parseNumberToDisplay } from '@subwallet/extension-koni-base/utils';

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { BN } from '@polkadot/util';

export function getPSP22ContractPromise (apiPromise: ApiPromise, contractAddress: string) {
  return new ContractPromise(apiPromise, _PSP22_ABI, contractAddress);
}

export function getPSP34ContractPromise (apiPromise: ApiPromise, contractAddress: string) {
  return new ContractPromise(apiPromise, _PSP34_ABI, contractAddress);
}

export async function getPSP34Transaction (
  evmApiMap: Record<string, _EvmApi>,
  substrateApiMap: Record<string, _SubstrateApi>,
  chainInfo: _ChainInfo,
  networkKey: string,
  contractAddress: string,
  senderAddress: string,
  recipientAddress: string,
  onChainOption: Record<string, string>
) {
  const apiPromise = substrateApiMap[networkKey].api;
  const contractPromise = getPSP34ContractPromise(apiPromise, contractAddress);
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const [info, balance] = await Promise.all([
      contractPromise.tx['psp34::transfer']({ gasLimit: '10000' }, recipientAddress, onChainOption, {}).paymentInfo(senderAddress),
      getFreeBalance(networkKey, senderAddress, substrateApiMap, evmApiMap)
    ]);

    const binaryBalance = new BN(balance);
    const balanceError = info.partialFee.gt(binaryBalance);

    const feeString = parseNumberToDisplay(info.partialFee, decimals) + ` ${symbol}`;

    return {
      error: false,
      estimatedFee: feeString,
      balanceError
    } as SubstrateNftTransaction;
  } catch (e) {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    if (e.toString().includes('Error: createType(RuntimeDispatchInfo):: Struct: failed on weight: u64:: Assertion failed')) {
      return {
        error: false,
        estimatedFee: `0.0000 ${symbol}`,
        balanceError: false
      } as SubstrateNftTransaction;
    }

    console.error('error handling WASM NFT transfer', e);

    return {
      error: true,
      balanceError: false
    };
  }
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
