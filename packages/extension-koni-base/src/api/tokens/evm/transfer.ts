// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Common from '@ethereumjs/common';
import { ApiProps, BasicTxResponse, ExternalRequestPromise, ExternalRequestPromiseStatus, HandleBasicTx, NetworkJson, TransferErrorCode } from '@subwallet/extension-base/background/KoniTypes';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { ERC721Contract, getERC20Contract } from '@subwallet/extension-koni-base/api/tokens/evm/web3';
import { keyring } from '@subwallet/ui-keyring';
import BigN from 'bignumber.js';
import BNEther from 'bn.js';
import { Transaction } from 'ethereumjs-tx';
import Web3 from 'web3';
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

  if (['bobabase', 'bobabeam'].indexOf(networkKey) > -1) {
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
  network: NetworkJson;
  transactionObject: TransactionConfig;
  web3ApiMap: Record<string, Web3 >;
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
  changeValue,
  network,
  transactionObject,
  web3ApiMap }: HandleTransferProps) {
  const networkKey = network.key;
  const web3Api = web3ApiMap[networkKey];
  const nonce = await web3Api.eth.getTransactionCount(address);

  const common = Common.forCustomChain('mainnet', {
    name: networkKey,
    networkId: network.evmChainId as number,
    chainId: network.evmChainId as number
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
    web3Api.eth.sendSignedTransaction(callHash)
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
  network: NetworkJson,
  to: string,
  value: string,
  transferAll: boolean,
  web3ApiMap: Record<string, Web3>
): Promise<[TransactionConfig, string, string]> {
  const networkKey = network.key;
  const web3Api = web3ApiMap[networkKey];
  const gasPrice = await web3Api.eth.getGasPrice();
  const transactionObject = {
    gasPrice: gasPrice,
    to: to
  } as TransactionConfig;
  const gasLimit = await web3Api.eth.estimateGas(transactionObject);

  transactionObject.gas = gasLimit;

  const estimateFee = parseInt(gasPrice) * gasLimit;

  transactionObject.value = transferAll ? new BN(value).add(new BN(estimateFee).neg()) : value;

  return [transactionObject, transactionObject.value.toString(), estimateFee.toString()];
}

interface EVMTransferProps {
  from: string;
  callback: (data: BasicTxResponse) => void;
  network: NetworkJson;
  to: string;
  transferAll: boolean;
  value: string;
  web3ApiMap: Record<string, Web3>;
}

export async function makeEVMTransfer ({ callback,
  from,
  network,
  to,
  transferAll,
  value,
  web3ApiMap }: EVMTransferProps): Promise<void> {
  const [transactionObject, changeValue] = await getEVMTransactionObject(network, to, value, transferAll, web3ApiMap);

  await handleTransfer({
    address: from,
    callback: callback,
    changeValue: changeValue,
    network: network,
    web3ApiMap: web3ApiMap,
    transactionObject: transactionObject
  });
}

export async function getERC20TransactionObject (
  assetAddress: string,
  network: NetworkJson,
  from: string,
  to: string,
  value: string,
  transferAll: boolean,
  web3ApiMap: Record<string, Web3>
): Promise<[TransactionConfig, string, string]> {
  const networkKey = network.key;
  const web3Api = web3ApiMap[networkKey];
  const erc20Contract = getERC20Contract(networkKey, assetAddress, web3ApiMap);

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
  const gasPrice = await web3Api.eth.getGasPrice();
  const transactionObject = {
    gasPrice: gasPrice,
    from,
    to: assetAddress,
    data: transferData
  } as TransactionConfig;

  const gasLimit = await web3Api.eth.estimateGas(transactionObject);

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
  network: NetworkJson;
  to: string;
  transferAll: boolean;
  value: string;
  web3ApiMap: Record<string, Web3>;
}

export async function makeERC20Transfer ({ assetAddress,
  callback,
  from,
  network,
  to,
  transferAll,
  value,
  web3ApiMap }: ERC20TransferProps) {
  const [transactionObject, changeValue] = await getERC20TransactionObject(assetAddress, network, from, to, value, transferAll, web3ApiMap);

  await handleTransfer({
    address: from,
    callback: callback,
    changeValue: changeValue,
    network: network,
    web3ApiMap: web3ApiMap,
    transactionObject: transactionObject
  });
}

export async function getERC721Transaction (
  web3ApiMap: Record<string, Web3>,
  dotSamaApiMap: Record<string, ApiProps>,
  networkJson: NetworkJson,
  networkKey: string,
  contractAddress: string,
  senderAddress: string,
  recipientAddress: string,
  tokenId: string) {
  const web3 = web3ApiMap[networkKey];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const contract = new web3.eth.Contract(ERC721Contract, contractAddress);

  const [fromAccountTxCount, gasPriceGwei, freeBalance] = await Promise.all([
    web3.eth.getTransactionCount(senderAddress),
    web3.eth.getGasPrice(),
    getFreeBalance(networkKey, senderAddress, dotSamaApiMap, web3ApiMap)
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
    gasPrice: web3.utils.toHex(gasPriceGwei),
    gasLimit: web3.utils.toHex(gasLimit as number),
    to: contractAddress,
    value: '0x00',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    data: contract.methods.safeTransferFrom(senderAddress, recipientAddress, tokenId).encodeABI()
  };
  const rawFee = gasLimit * parseFloat(gasPriceGwei);
  // @ts-ignore
  const estimatedFee = rawFee / (10 ** networkJson.decimals);
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  const feeString = estimatedFee.toString() + ' ' + networkJson.nativeToken;

  const binaryFee = new BN(rawFee.toString());
  const balanceError = binaryFee.gt(binaryFreeBalance);

  return {
    tx: rawTransaction,
    estimatedFee: feeString,
    balanceError
  };
}
