// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _Address } from '@subwallet/extension-base/background/KoniTypes';
import { _ERC20_ABI } from '@subwallet/extension-base/koni/api/contract-handler/utils';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { calculateGasFeeParams } from '@subwallet/extension-base/services/fee-service/utils';
import { TransactionConfig } from 'web3-core';
import { Contract } from 'web3-eth-contract';

export const getERC20Contract = (assetAddress: string, evmApi: _EvmApi, options = {}): Contract => {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return new evmApi.api.eth.Contract(_ERC20_ABI, assetAddress, options);
};

export function getWeb3Contract (contractAddress: _Address, evmApi: _EvmApi, contractAbi: Record<string, any>, options = {}): Contract {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return new evmApi.api.eth.Contract(contractAbi, contractAddress, options);
}

export async function getERC20Allowance (spender: _Address, owner: _Address, contractAddress: _Address, evmApi: _EvmApi): Promise<string> {
  const tokenContract = getERC20Contract(contractAddress, evmApi);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const allowanceCall = tokenContract.methods.allowance(owner, spender);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  return (await allowanceCall.call()) as string;
}

export async function getERC20SpendingApprovalTx (spender: _Address, owner: _Address, contractAddress: _Address, evmApi: _EvmApi, amount = '115792089237316195423570985008687907853269984665640564039457584007913129639935'): Promise<TransactionConfig> {
  const tokenContract = getERC20Contract(contractAddress, evmApi);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const approveCall = tokenContract.methods.approve(spender, amount); // TODO: need test
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const approveEncodedCall = approveCall.encodeABI() as string;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  const gasLimit = await approveCall.estimateGas({ from: owner }) as number;
  const priority = await calculateGasFeeParams(evmApi, evmApi.chainSlug);

  return {
    from: owner,
    to: contractAddress,
    data: approveEncodedCall,
    gas: gasLimit,
    gasPrice: priority.gasPrice,
    maxFeePerGas: priority.maxFeePerGas?.toString(),
    maxPriorityFeePerGas: priority.maxPriorityFeePerGas?.toString()
  } as TransactionConfig;
}
