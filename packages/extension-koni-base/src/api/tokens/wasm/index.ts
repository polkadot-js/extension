// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, SubstrateNftTransaction } from '@subwallet/extension-base/background/KoniTypes';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { PSP22Contract, PSP34Contract } from '@subwallet/extension-koni-base/api/tokens/wasm/helper';
import { parseNumberToDisplay } from '@subwallet/extension-koni-base/utils';
import Web3 from 'web3';

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { BN } from '@polkadot/util';

export function getPSP22ContractPromise (apiPromise: ApiPromise, contractAddress: string) {
  return new ContractPromise(apiPromise, PSP22Contract, contractAddress);
}

export function getPSP34ContractPromise (apiPromise: ApiPromise, contractAddress: string) {
  return new ContractPromise(apiPromise, PSP34Contract, contractAddress);
}

export async function getPSP34Transaction (
  web3ApiMap: Record<string, Web3>,
  dotSamaApiMap: Record<string, ApiProps>,
  networkJson: NetworkJson,
  networkKey: string,
  contractAddress: string,
  senderAddress: string,
  recipientAddress: string,
  onChainOption: Record<string, string>
) {
  const apiPromise = dotSamaApiMap[networkKey].api;
  const contractPromise = getPSP34ContractPromise(apiPromise, contractAddress);

  try {
    const [info, balance] = await Promise.all([
      contractPromise.tx['psp34::transfer']({ gasLimit: '10000' }, recipientAddress, onChainOption, {}).paymentInfo(senderAddress),
      getFreeBalance(networkKey, senderAddress, dotSamaApiMap, web3ApiMap)
    ]);

    const binaryBalance = new BN(balance);
    const balanceError = info.partialFee.gt(binaryBalance);

    const feeString = parseNumberToDisplay(info.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;

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
        estimatedFee: `0.0000 ${networkJson.nativeToken as string}`,
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

export async function getPSP34TransferExtrinsic (networkKey: string, apiProp: ApiProps, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  const contractAddress = params.contractAddress as string;
  const onChainOption = params.onChainOption as Record<string, string>;

  try {
    const contractPromise = getPSP34ContractPromise(apiProp.api, contractAddress);
    const transferQuery = await contractPromise.query['psp34::transfer'](senderAddress, { gasLimit: -1 }, recipientAddress, onChainOption, {});

    const gasLimit = transferQuery.gasRequired.toString();

    return contractPromise.tx['psp34::transfer']({ gasLimit }, recipientAddress, onChainOption, {});
  } catch (e) {
    console.error('Error getting WASM NFT transfer extrinsic', e);

    return null;
  }
}
