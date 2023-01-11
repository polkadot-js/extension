// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Common from '@ethereumjs/common';
import { _ChainInfo } from '@subwallet/chain/types';
import { BasicTxResponse, ExternalRequestPromise, ExternalRequestPromiseStatus, HandleBasicTx, TransferErrorCode } from '@subwallet/extension-base/background/KoniTypes';
import { _BALANCE_PARSING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenInfo, _getEvmChainId } from '@subwallet/extension-base/services/chain-service/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { ERC721Contract, getERC20Contract } from '@subwallet/extension-koni-base/api/tokens/evm/web3';
import { keyring } from '@subwallet/ui-keyring';
import BigN from 'bignumber.js';
import BNEther from 'bn.js';
import { Transaction } from 'ethereumjs-tx';
import { TransactionConfig, TransactionReceipt } from 'web3-core';

import { BN, hexToBn } from '@polkadot/util';

interface HandleTransferBalanceResultProps {
  callback: HandleBasicTx;
  changeValue: string;
  networkKey: string;
  receipt: TransactionReceipt;
  response: BasicTxResponse;
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

interface HandleTransferProps {
  address: string;
  callback: (data: BasicTxResponse) => void;
  changeValue: string;
  chainInfo: _ChainInfo;
  transactionObject: TransactionConfig;
  evmApiMap: Record<string, _EvmApi>;
}

const convertValueToNumber = (value?: number | string | BNEther): number => {
  if (!value) {
    return 0;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return new BigN(value).toNumber();
  } else {
    return value.toNumber();
  }
};

export async function handleTransfer ({ address,
  callback,
  chainInfo,
  changeValue,
  evmApiMap,
  transactionObject }: HandleTransferProps) {
  const networkKey = chainInfo.slug;
  const web3Api = evmApiMap[networkKey];
  const nonce = await web3Api.api.eth.getTransactionCount(address);

  const common = Common.forCustomChain('mainnet', {
    name: networkKey,
    networkId: _getEvmChainId(chainInfo),
    chainId: _getEvmChainId(chainInfo)
  }, 'petersburg');
  const txObject: TransactionConfig = {
    gasPrice: convertValueToNumber(transactionObject.gasPrice),
    to: transactionObject.to,
    value: convertValueToNumber(transactionObject.value),
    data: transactionObject.data,
    gas: convertValueToNumber(transactionObject.gas),
    nonce: nonce
  };
  // @ts-ignore
  const tx = new Transaction(txObject, { common });

  const pair = keyring.getPair(address);

  if (pair.isLocked) {
    keyring.unlockPair(pair.address);
  }

  const callHash = pair.evmSigner.signTransaction(tx);

  const response: BasicTxResponse = {
    errors: []
  };

  try {
    web3Api.api.eth.sendSignedTransaction(callHash)
      .on('transactionHash', function (hash: string) {
        console.log('transactionHash', hash);
        response.extrinsicHash = hash;
        callback(response);
      })
      // .on('confirmation', function (confirmationNumber, receipt) {
      //   console.log('confirmation', confirmationNumber, receipt);
      //   response.step = TransferStep.PROCESSING;
      //   response.data = receipt;
      //   callback(response);
      // })
      .on('receipt', function (receipt: TransactionReceipt) {
        handleTransferBalanceResult({ receipt: receipt, response: response, callback: callback, networkKey: networkKey, changeValue: changeValue });
      }).catch((e) => {
        response.status = false;
        response.errors?.push({
          code: TransferErrorCode.TRANSFER_ERROR,
          message: (e as Error).message
        });
        callback(response);
      });
  } catch (error) {
    response.status = false;
    response.txError = true;
    response.errors?.push({
      code: TransferErrorCode.TRANSFER_ERROR,
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      message: error.message
    });
    callback(response);
  }
}

export async function getEVMTransactionObject (
  chainInfo: _ChainInfo,
  to: string,
  value: string,
  transferAll: boolean,
  evmApiMap: Record<string, _EvmApi>
): Promise<[TransactionConfig, string, string]> {
  const networkKey = chainInfo.slug;
  const web3Api = evmApiMap[networkKey];
  const gasPrice = await web3Api.api.eth.getGasPrice();
  const transactionObject = {
    gasPrice: gasPrice,
    to: to
  } as TransactionConfig;
  const gasLimit = await web3Api.api.eth.estimateGas(transactionObject);

  transactionObject.gas = gasLimit;

  const estimateFee = parseInt(gasPrice) * gasLimit;

  transactionObject.value = transferAll ? new BN(value).add(new BN(estimateFee).neg()) : value;

  return [transactionObject, transactionObject.value.toString(), estimateFee.toString()];
}

interface EVMTransferProps {
  from: string;
  callback: (data: BasicTxResponse) => void;
  chainInfo: _ChainInfo;
  to: string;
  transferAll: boolean;
  value: string;
  evmApiMap: Record<string, _EvmApi>;
}

export async function makeEVMTransfer ({ callback,
  chainInfo,
  evmApiMap,
  from,
  to,
  transferAll,
  value }: EVMTransferProps): Promise<void> {
  const [transactionObject, changeValue] = await getEVMTransactionObject(chainInfo, to, value, transferAll, evmApiMap);

  await handleTransfer({
    address: from,
    callback: callback,
    changeValue: changeValue,
    chainInfo: chainInfo,
    evmApiMap: evmApiMap,
    transactionObject: transactionObject
  });
}

export async function getERC20TransactionObject (
  assetAddress: string,
  chainInfo: _ChainInfo,
  from: string,
  to: string,
  value: string,
  transferAll: boolean,
  evmApiMap: Record<string, _EvmApi>
): Promise<[TransactionConfig, string, string]> {
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
  const gasPrice = await evmApi.api.eth.getGasPrice();
  const transactionObject = {
    gasPrice: gasPrice,
    from,
    to: assetAddress,
    data: transferData
  } as TransactionConfig;

  const gasLimit = await evmApi.api.eth.estimateGas(transactionObject);

  transactionObject.gas = gasLimit;

  const estimateFee = parseInt(gasPrice) * gasLimit;

  if (transferAll) {
    transferValue = new BN(freeAmount).toString();
    transactionObject.data = generateTransferData(to, transferValue);
  }

  return [transactionObject, transferValue, estimateFee.toString()];
}

interface ERC20TransferProps {
  assetAddress: string;
  callback: (data: BasicTxResponse) => void;
  from: string;
  chainInfo: _ChainInfo;
  to: string;
  transferAll: boolean;
  value: string;
  evmApiMap: Record<string, _EvmApi>;
}

export async function makeERC20Transfer ({ assetAddress,
  callback,
  chainInfo,
  evmApiMap,
  from,
  to,
  transferAll,
  value }: ERC20TransferProps) {
  const [transactionObject, changeValue] = await getERC20TransactionObject(assetAddress, chainInfo, from, to, value, transferAll, evmApiMap);

  await handleTransfer({
    address: from,
    callback: callback,
    changeValue: changeValue,
    chainInfo: chainInfo,
    evmApiMap: evmApiMap,
    transactionObject: transactionObject
  });
}

export async function getERC721Transaction (
  evmApiMap: Record<string, _EvmApi>,
  substrateApiMap: Record<string, _SubstrateApi>,
  chainInfo: _ChainInfo,
  networkKey: string,
  contractAddress: string,
  senderAddress: string,
  recipientAddress: string,
  tokenId: string) {
  const web3 = evmApiMap[networkKey];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const contract = new web3.api.eth.Contract(ERC721Contract, contractAddress);

  const [fromAccountTxCount, gasPriceGwei, freeBalance] = await Promise.all([
    web3.api.eth.getTransactionCount(senderAddress),
    web3.api.eth.getGasPrice(),
    getFreeBalance(networkKey, senderAddress, substrateApiMap, evmApiMap)
  ]);

  const binaryFreeBalance = new BN(freeBalance);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
  const gasLimit = await contract.methods.safeTransferFrom(
    senderAddress,
    recipientAddress,
    tokenId
  ).estimateGas({
    from: senderAddress
  });

  const rawTransaction = {
    nonce: '0x' + fromAccountTxCount.toString(16),
    from: senderAddress,
    gasPrice: web3.api.utils.toHex(gasPriceGwei),
    gasLimit: web3.api.utils.toHex(gasLimit as number),
    to: contractAddress,
    value: '0x00',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    data: contract.methods.safeTransferFrom(senderAddress, recipientAddress, tokenId).encodeABI()
  };
  const { decimals, symbol } = _getChainNativeTokenInfo(chainInfo);
  const rawFee = gasLimit * parseFloat(gasPriceGwei);
  const estimatedFee = rawFee / (10 ** decimals);
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  const feeString = estimatedFee.toString() + ' ' + symbol;

  const binaryFee = new BN(rawFee.toString());
  const balanceError = binaryFee.gt(binaryFreeBalance);

  return {
    tx: rawTransaction,
    estimatedFee: feeString,
    balanceError
  };
}
