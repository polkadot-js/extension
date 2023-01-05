// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicTxResponse, ExternalRequestPromiseStatus } from '@subwallet/extension-base/background/KoniTypes';
import { QrState, Web3Transaction } from '@subwallet/extension-base/signers/types';
import QrSigner from '@subwallet/extension-base/signers/web3/QrSigner';
import { anyNumberToBN } from '@subwallet/extension-koni-base/utils/eth';
import { TransactionReceipt } from 'web3-core';

import { EvmExternalProps, parseTxAndSignature } from '../shared';

interface TransferNftExternalArg extends EvmExternalProps{
  rawTransaction: Record<string, any>;
}

export async function handleTransferNftQr ({ callback,
  chainId,
  from,
  id,
  network,
  rawTransaction,
  setState,
  updateState,
  web3ApiMap }: TransferNftExternalArg) {
  const networkKey = network.key;
  const web3 = web3ApiMap[networkKey];
  const response: BasicTxResponse = {};

  const nonce = await web3.eth.getTransactionCount(from);

  const txObject: Web3Transaction = {
    nonce: nonce,
    from: from,
    gasPrice: anyNumberToBN(rawTransaction.gasPrice as string).toNumber(),
    gasLimit: anyNumberToBN(rawTransaction.gasLimit as string).toNumber(),
    to: rawTransaction.to !== undefined ? rawTransaction.to as string : '',
    value: anyNumberToBN(rawTransaction.value as string).toNumber(),
    data: rawTransaction.data ? rawTransaction.data as string : '',
    chainId: chainId
  };

  const qrCallback = ({ qrState }: {qrState: QrState}) => {
    // eslint-disable-next-line node/no-callback-literal
    callback({
      qrState: qrState,
      externalState: { externalId: qrState.qrId }
    });
  };

  const qrResolver = () => {
    // eslint-disable-next-line node/no-callback-literal
    callback({
      isBusy: true
    });
  };

  const signer = new QrSigner({
    callback: qrCallback,
    id,
    setState,
    resolver: qrResolver
  });

  const { signature } = await signer.signTransaction(txObject);

  try {
    const signed = parseTxAndSignature(txObject, signature);

    web3.eth.sendSignedTransaction(signed)
      .on('transactionHash', function (hash: string) {
        console.log('transactionHash', hash);
        response.callHash = signed;
        response.isBusy = true;
        callback(response);
      })
      .on('receipt', function (receipt: TransactionReceipt) {
        response.status = receipt.status;
        response.isBusy = true;
        response.extrinsicHash = receipt.transactionHash;
        updateState({ status: receipt.status ? ExternalRequestPromiseStatus.COMPLETED : ExternalRequestPromiseStatus.FAILED });
        callback(response);
      }).catch((e) => {
        console.log('Error on transfer nft', (e as Error).message);
        response.txError = true;
        response.status = false;
        updateState({ status: ExternalRequestPromiseStatus.FAILED });
        callback(response);
      });
  } catch (error) {
    response.txError = true;
    response.isBusy = false;
    console.log('Error on transfer nft', (error as Error).message);
    callback(response);
  }
}
