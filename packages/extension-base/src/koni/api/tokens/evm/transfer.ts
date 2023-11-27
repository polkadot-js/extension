// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ExternalRequestPromise, ExternalRequestPromiseStatus, HandleBasicTx, TransactionResponse } from '@subwallet/extension-base/background/KoniTypes';
import { getERC20Contract } from '@subwallet/extension-base/koni/api/tokens/evm/web3';
import { _BALANCE_PARSING_CHAIN_GROUP, EVM_REFORMAT_DECIMALS } from '@subwallet/extension-base/services/chain-service/constants';
import { _ERC721_ABI } from '@subwallet/extension-base/services/chain-service/helper';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { recalculateGasPrice } from '@subwallet/extension-base/utils/eth';
import { TransactionConfig, TransactionReceipt } from 'web3-core';

import { BN, hexToBn } from '@polkadot/util';

interface HandleTransferBalanceResultProps {
  callback: HandleBasicTx;
  changeValue: string;
  networkKey: string;
  receipt: TransactionReceipt;
  response: TransactionResponse;
  updateState?: (promise: Partial<ExternalRequestPromise>) => void;
}

export const handleTransferBalanceResult = ({ callback,
  changeValue,
  networkKey,
  receipt,
  response,
  updateState }: HandleTransferBalanceResultProps) => {
  response.status = true;
  let fee: string;

  if (_BALANCE_PARSING_CHAIN_GROUP.bobabeam.indexOf(networkKey) > -1) {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    fee = hexToBn(receipt.l1Fee || '0x0').add(hexToBn(receipt.l2BobaFee || '0x0')).toString();
  } else {
    fee = (receipt.gasUsed * receipt.effectiveGasPrice).toString();
  }

  response.txResult = {
    change: changeValue || '0',
    fee
  };
  updateState && updateState({ status: receipt.status ? ExternalRequestPromiseStatus.COMPLETED : ExternalRequestPromiseStatus.FAILED });
  callback(response);
};

export async function getEVMTransactionObject (
  chainInfo: _ChainInfo,
  from: string,
  to: string,
  value: string,
  transferAll: boolean,
  evmApiMap: Record<string, _EvmApi>
): Promise<[TransactionConfig, string]> {
  const networkKey = chainInfo.slug;
  const web3Api = evmApiMap[networkKey];
  const _price = await web3Api.api.eth.getGasPrice();
  const gasPrice = recalculateGasPrice(_price, chainInfo.slug);
  const transactionObject = {
    gasPrice: gasPrice,
    to: to,
    value: value,
    from: from
  } as TransactionConfig;
  const gasLimit = await web3Api.api.eth.estimateGas(transactionObject);

  transactionObject.gas = gasLimit;

  const estimateFee = new BN(gasLimit).mul(new BN(gasPrice));

  transactionObject.value = transferAll ? new BN(value).sub(estimateFee).toString() : value;

  if (EVM_REFORMAT_DECIMALS.acala.includes(networkKey)) {
    const numberReplace = 18 - 12;

    transactionObject.value = transactionObject.value.substring(0, transactionObject.value.length - 6) + new Array(numberReplace).fill('0').join('');
  }

  return [transactionObject, transactionObject.value.toString()];
}

export async function getERC20TransactionObject (
  assetAddress: string,
  chainInfo: _ChainInfo,
  from: string,
  to: string,
  value: string,
  transferAll: boolean,
  evmApiMap: Record<string, _EvmApi>
): Promise<[TransactionConfig, string]> {
  const networkKey = chainInfo.slug;
  const evmApi = evmApiMap[networkKey];
  const erc20Contract = getERC20Contract(networkKey, assetAddress, evmApiMap);

  let freeAmount = new BN(0);
  let transferValue = value;

  if (transferAll) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const bal = await erc20Contract.methods.balanceOf(from).call() as string;

    freeAmount = new BN(bal || '0');
    transferValue = freeAmount.toString() || '0';
  }

  function generateTransferData (to: string, transferValue: string): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    return erc20Contract.methods.transfer(to, transferValue).encodeABI() as string;
  }

  const transferData = generateTransferData(to, transferValue);
  const [gasLimit, _price] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    erc20Contract.methods.transfer(to, transferValue).estimateGas({ from }) as number,
    evmApi.api.eth.getGasPrice()
  ]);

  const gasPrice = recalculateGasPrice(_price, chainInfo.slug);

  const transactionObject = {
    gasPrice: gasPrice,
    gas: gasLimit,
    from,
    to: assetAddress,
    data: transferData
  } as TransactionConfig;

  if (transferAll) {
    transferValue = new BN(freeAmount).toString();
    transactionObject.data = generateTransferData(to, transferValue);
  }

  return [transactionObject, transferValue];
}

export async function getERC721Transaction (
  web3Api: _EvmApi,
  chain: string,
  contractAddress: string,
  senderAddress: string,
  recipientAddress: string,
  tokenId: string): Promise<TransactionConfig> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const contract = new web3Api.api.eth.Contract(_ERC721_ABI, contractAddress);

  const [gasLimit, _price] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    contract.methods.safeTransferFrom(senderAddress, recipientAddress, tokenId).estimateGas({ from: senderAddress }) as number,
    web3Api.api.eth.getGasPrice()
  ]);

  const gasPrice = recalculateGasPrice(_price, chain);

  return {
    from: senderAddress,
    gasPrice,
    gas: gasLimit,
    to: contractAddress,
    value: '0x00',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    data: contract.methods.safeTransferFrom(senderAddress, recipientAddress, tokenId).encodeABI()
  };
}
