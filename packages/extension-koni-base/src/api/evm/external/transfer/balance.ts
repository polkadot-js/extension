// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicTxResponse, ExternalRequestPromiseStatus, TransferErrorCode } from '@subwallet/extension-base/background/KoniTypes';
import { QrState, Web3Transaction } from '@subwallet/extension-base/signers/types';
import QrSigner from '@subwallet/extension-base/signers/web3/QrSigner';
import { EvmExternalProps, parseTxAndSignature } from '@subwallet/extension-koni-base/api/evm/external/shared';
import { getERC20TransactionObject, getEVMTransactionObject, handleTransferBalanceResult } from '@subwallet/extension-koni-base/api/tokens/evm/transfer';
import { anyNumberToBN } from '@subwallet/extension-koni-base/utils/eth';
import { TransactionConfig, TransactionReceipt } from 'web3-core';

interface TransferQrArg extends EvmExternalProps {
  transactionObject: TransactionConfig;
  changeValue: string;
}

export async function handleTransferQr ({ callback,
  chainId,
  changeValue,
  from,
  id,
  network,
  setState,
  transactionObject,
  updateState,
  web3ApiMap }: TransferQrArg) {
  const networkKey = network.key;
  const web3Api = web3ApiMap[networkKey];
  const response: BasicTxResponse = {
    errors: []
  };

  const nonce = await web3Api.eth.getTransactionCount(from);

  const txObject: Web3Transaction = {
    nonce: nonce,
    from: from,
    gasPrice: anyNumberToBN(transactionObject.gasPrice).toNumber(),
    gasLimit: anyNumberToBN(transactionObject.gas).toNumber(),
    to: transactionObject.to !== undefined ? transactionObject.to : '',
    value: anyNumberToBN(transactionObject.value).toNumber(),
    data: transactionObject.data ? transactionObject.data : '',
    chainId: chainId
  };

  const qrCallback = ({ qrState }: {qrState: QrState}) => {
    // eslint-disable-next-line node/no-callback-literal
    callback({
      errors: [],
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

    web3Api.eth.sendSignedTransaction(signed)
      .on('transactionHash', function (hash: string) {
        console.log('transactionHash', hash);
        response.extrinsicHash = hash;
        response.isBusy = true;
        callback(response);
      })
      .on('receipt', function (receipt: TransactionReceipt) {
        handleTransferBalanceResult({ receipt: receipt, response: response, callback: callback, networkKey: networkKey, changeValue: changeValue, updateState: updateState });
      }).catch((e) => {
        response.status = false;
        response.txError = false;
        response.isBusy = false;
        response.errors?.push({
          code: TransferErrorCode.TRANSFER_ERROR,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          message: e.message
        });
        updateState({ status: ExternalRequestPromiseStatus.FAILED });
        callback(response);
      });
  } catch (error) {
    response.txError = true;
    response.errors?.push({
      code: TransferErrorCode.TRANSFER_ERROR,
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      message: error.message
    });
    response.isBusy = false;
    updateState({ status: ExternalRequestPromiseStatus.FAILED });
    callback(response);
  }
}

interface TransferArg extends EvmExternalProps{
  to: string;
  value: string;
  transferAll: boolean;
}

type EVMTransferArg = TransferArg

export async function makeEVMTransferQr ({ callback,
  chainId,
  from,
  id,
  network,
  setState,
  to,
  transferAll,
  updateState,
  value,
  web3ApiMap }: EVMTransferArg): Promise<void> {
  const [transactionObject, changeValue] = await getEVMTransactionObject(network, to, value, transferAll, web3ApiMap);

  await handleTransferQr({
    transactionObject,
    changeValue,
    network,
    web3ApiMap,
    callback,
    id,
    setState,
    chainId,
    updateState,
    from
  });
}

interface ERC20TransferArg extends TransferArg{
  assetAddress: string;
}

export async function makeERC20TransferQr ({ assetAddress,
  callback,
  chainId,
  from,
  id,
  network,
  setState,
  to,
  transferAll,
  updateState,
  value,
  web3ApiMap }: ERC20TransferArg) {
  const [transactionObject, changeValue] = await getERC20TransactionObject(assetAddress, network, from, to, value, transferAll, web3ApiMap);

  await handleTransferQr({
    callback,
    chainId,
    from,
    id,
    setState,
    web3ApiMap,
    changeValue,
    network,
    transactionObject,
    updateState
  });
}
