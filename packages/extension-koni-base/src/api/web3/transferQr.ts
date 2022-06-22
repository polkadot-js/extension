// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExternalRequestPromise, ExternalRequestPromiseStatus, ResponseNftTransferQr, ResponseTransferQr, TransferErrorCode, TransferStep } from '@subwallet/extension-base/background/KoniTypes';
import { QrState, Web3Transaction } from '@subwallet/extension-base/signers/types';
import QrSigner from '@subwallet/extension-base/signers/web3/QrSigner';
import { getERC20Contract } from '@subwallet/extension-koni-base/api/web3/web3';
import { anyNumberToBN } from '@subwallet/extension-koni-base/utils/eth';
import RLP, { Input } from 'rlp';
import Web3 from 'web3';
import { TransactionConfig, TransactionReceipt } from 'web3-core';

import { BN, u8aToHex } from '@polkadot/util';

interface BaseArg {
  id: string;
  from: string;
  chainId: number;
  networkKey: string;
  web3ApiMap: Record<string, Web3>;
  setState: (promise: ExternalRequestPromise) => void;
  updateState: (promise: Partial<ExternalRequestPromise>) => void;
  callback: (data: ResponseTransferQr) => void;
}

interface TransferQrArg extends BaseArg{
  transactionObject: TransactionConfig;
  changeValue: string;
}

const parseTxAndSignature = (tx: Web3Transaction, _signature: `0x${string}`): `0x${string}` => {
  const signature = _signature.slice(2);
  const r = `0x${signature.substring(0, 64)}`;
  const s = `0x${signature.substring(64, 128)}`;
  const v = `0x${signature.substring(128)}`;
  const data: Input = [
    tx.nonce,
    tx.gasPrice,
    tx.gasLimit,
    tx.to,
    tx.value,
    tx.data,
    v,
    r,
    s
  ];
  const encoded = RLP.encode(data);

  return u8aToHex(encoded);
};

export async function handleTransferQr ({ callback,
  chainId,
  changeValue,
  from,
  id,
  networkKey,
  setState,
  transactionObject,
  updateState,
  web3ApiMap }: TransferQrArg) {
  const web3Api = web3ApiMap[networkKey];
  const response: ResponseTransferQr = {
    step: TransferStep.READY,
    errors: [],
    extrinsicStatus: undefined,
    data: {}
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
      step: TransferStep.READY,
      errors: [],
      extrinsicStatus: undefined,
      data: {},
      qrState: qrState
    });
  };

  const signer = new QrSigner(qrCallback, id, setState);

  const { signature } = await signer.signTransaction(txObject);

  try {
    const signed = parseTxAndSignature(txObject, signature);

    web3Api.eth.sendSignedTransaction(signed)
      .on('transactionHash', function (hash: string) {
        console.log('transactionHash', hash);
        response.step = TransferStep.READY;
        response.extrinsicHash = hash;
        response.isBusy = true;
        callback(response);
      })
      .on('receipt', function (receipt: TransactionReceipt) {
        response.step = receipt.status ? TransferStep.SUCCESS : TransferStep.ERROR;
        response.txResult = {
          change: changeValue || '0',
          fee: (receipt.gasUsed * receipt.effectiveGasPrice).toString()
        };
        response.isBusy = false;
        updateState({ status: receipt.status ? ExternalRequestPromiseStatus.COMPLETED : ExternalRequestPromiseStatus.FAILED });
        callback(response);
      }).catch((e) => {
        response.step = TransferStep.ERROR;
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
    response.step = TransferStep.ERROR;
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

export async function getEVMTransactionObject (
  networkKey: string,
  to: string,
  value: string,
  transferAll: boolean,
  web3ApiMap: Record<string, Web3>
): Promise<[TransactionConfig, string, string]> {
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

interface TransferArg extends BaseArg{
  to: string;
  value: string;
  transferAll: boolean;
}

type EVMTransferArg = TransferArg

export async function makeEVMTransferQr ({ callback,
  chainId,
  from,
  id,
  networkKey,
  setState,
  to,
  transferAll,
  updateState,
  value,
  web3ApiMap }: EVMTransferArg): Promise<void> {
  const [transactionObject, changeValue] = await getEVMTransactionObject(networkKey, to, value, transferAll, web3ApiMap);

  await handleTransferQr({
    transactionObject,
    changeValue,
    networkKey,
    web3ApiMap,
    callback,
    id,
    setState,
    chainId,
    updateState,
    from
  });
}

export async function getERC20TransactionObject (
  assetAddress: string,
  networkKey: string,
  from: string,
  to: string,
  value: string,
  transferAll: boolean,
  web3ApiMap: Record<string, Web3>
): Promise<[TransactionConfig, string, string]> {
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

interface ERC20TransferArg extends TransferArg{
  assetAddress: string;
}

export async function makeERC20TransferQr ({ assetAddress,
  callback,
  chainId,
  from,
  id,
  networkKey,
  setState,
  to,
  transferAll,
  updateState,
  value,
  web3ApiMap }: ERC20TransferArg) {
  const [transactionObject, changeValue] = await getERC20TransactionObject(assetAddress, networkKey, from, to, value, transferAll, web3ApiMap);

  await handleTransferQr({
    callback,
    chainId,
    from,
    id,
    setState,
    web3ApiMap,
    changeValue,
    networkKey,
    transactionObject,
    updateState
  });
}

interface TransferNftQrArg extends Omit<BaseArg, 'callback'>{
  rawTransaction: Record<string, any>;
  callback: (data: ResponseNftTransferQr) => void;
  isSendingSelf: boolean;
}

export async function handleTransferNftQr ({ callback,
  chainId,
  from,
  id,
  isSendingSelf,
  networkKey,
  rawTransaction,
  setState,
  updateState,
  web3ApiMap }: TransferNftQrArg) {
  const web3 = web3ApiMap[networkKey];
  const response: ResponseNftTransferQr = {
    isSendingSelf: isSendingSelf
  };

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
      isSendingSelf: isSendingSelf,
      qrState: qrState
    });
  };

  const signer = new QrSigner(qrCallback, id, setState);

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
        response.transactionHash = receipt.transactionHash;
        updateState({ status: receipt.status ? ExternalRequestPromiseStatus.COMPLETED : ExternalRequestPromiseStatus.FAILED });
        callback(response);
      }).catch((e) => {
        console.log('Error on transfer nft', (e as Error).message);
        response.txError = true;
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
