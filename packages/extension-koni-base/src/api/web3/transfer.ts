// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionConfig, TransactionReceipt } from 'web3-core';

import { ResponseTransfer, TransferErrorCode, TransferStep } from '@polkadot/extension-base/background/KoniTypes';
import { getERC20Contract, getWeb3Api } from '@polkadot/extension-koni-base/api/web3/web3';
import { BN } from '@polkadot/util';

export async function handleTransfer (transactionObject: TransactionConfig, networkKey: string, privateKey: string, callback: (data: ResponseTransfer) => void) {
  const web3Api = getWeb3Api(networkKey);
  const signedTransaction = await web3Api.eth.accounts.signTransaction(transactionObject, privateKey);
  const response: ResponseTransfer = {
    step: TransferStep.READY,
    errors: [],
    extrinsicStatus: undefined,
    data: {}
  };

  try {
    signedTransaction?.rawTransaction && web3Api.eth.sendSignedTransaction(signedTransaction.rawTransaction)
      .on('transactionHash', function (hash: string) {
        console.log('transactionHash', hash);
        response.step = TransferStep.READY;
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

        response.step = TransferStep.SUCCESS;
        // response.txResult = {
        //   change:
        // }
        callback(response);
      }).catch((e) => {
        response.step = TransferStep.ERROR;
        response.errors?.push({
          code: TransferErrorCode.TRANSFER_ERROR,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          message: e.message
        });
        callback(response);
      });
  } catch (error) {
    response.step = TransferStep.ERROR;
    response.errors?.push({
      code: TransferErrorCode.TRANSFER_ERROR,
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      message: error.message
    });
    callback(response);
  }
}

export async function getEVMTransactionObject (networkKey: string, to: string, value: string, transferAll: boolean): Promise<[TransactionConfig, string]> {
  const web3Api = getWeb3Api(networkKey);
  const gasPrice = await web3Api.eth.getGasPrice();
  const transactionObject = {
    gasPrice: gasPrice,
    to: to
  } as TransactionConfig;
  const gasLimit = await web3Api.eth.estimateGas(transactionObject);

  transactionObject.gas = gasLimit;

  const estimateFee = parseInt(gasPrice) * gasLimit;

  transactionObject.value = transferAll ? new BN(value).add(new BN(estimateFee).neg()) : value;

  return [transactionObject, estimateFee.toString()];
}

export async function makeEVMTransfer (networkKey: string, to: string, privateKey: string, value: string, transferAll: boolean, callback: (data: ResponseTransfer) => void): Promise<void> {
  const [transactionObject] = await getEVMTransactionObject(networkKey, to, value, transferAll);

  await handleTransfer(transactionObject, networkKey, privateKey, callback);
}

export async function getERC20TransactionObject (assetAddress: string, networkKey: string, from: string, to: string, value: string, transferAll: boolean): Promise<[TransactionConfig, string]> {
  const web3Api = getWeb3Api(networkKey);
  const erc20Contract = getERC20Contract(networkKey, assetAddress);

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

  return [transactionObject, estimateFee.toString()];
}

export async function makeERC20Transfer (assetAddress: string, networkKey: string, from: string, to: string, privateKey: string, value: string, transferAll: boolean, callback: (data: ResponseTransfer) => void) {
  const [transactionObject] = await getERC20TransactionObject(assetAddress, networkKey, from, to, value, transferAll);

  await handleTransfer(transactionObject, networkKey, privateKey, callback);
}
