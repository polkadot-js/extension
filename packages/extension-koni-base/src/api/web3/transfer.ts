// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionConfig } from 'web3-core';

import { ResponseTransfer, TransferErrorCode, TransferStep } from '@polkadot/extension-base/background/KoniTypes';
import { getWeb3Api } from '@polkadot/extension-koni-base/api/web3/web3';
import { BN } from '@polkadot/util';

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
  const web3Api = getWeb3Api(networkKey);
  const [transactionObject] = await getEVMTransactionObject(networkKey, to, value, transferAll);
  const signedTransaction = await web3Api.eth.accounts.signTransaction(transactionObject, privateKey);
  const response: ResponseTransfer = {
    step: TransferStep.READY,
    errors: [],
    extrinsicStatus: undefined,
    data: {}
  };

  try {
    signedTransaction?.rawTransaction && web3Api.eth.sendSignedTransaction(signedTransaction.rawTransaction)
      .on('transactionHash', function (hash) {
        console.log('transactionHash', hash);
        response.step = TransferStep.READY;
        response.extrinsicHash = hash;
        callback(response);
      })
      .on('confirmation', function (confirmationNumber, receipt) {
        console.log('confirmation', confirmationNumber, receipt);
        response.step = TransferStep.PROCESSING;
        response.data = receipt;
        callback(response);
      })
      .on('receipt', function (receipt) {
        console.log('receipt', receipt);
        response.step = TransferStep.SUCCESS;
      });
  } catch (error) {
    response.step = TransferStep.ERROR;
    response.errors?.push({
      code: TransferErrorCode.TRANSFER_ERROR,
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      message: error.message
    });
  }
}
