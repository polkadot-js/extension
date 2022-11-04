// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, ResponseTransfer, TransferErrorCode, TransferStep } from '@subwallet/extension-base/background/KoniTypes';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { ERC721Contract, getERC20Contract } from '@subwallet/extension-koni-base/api/tokens/evm/web3';
import Web3 from 'web3';
import { TransactionConfig, TransactionReceipt } from 'web3-core';

import { BN, hexToBn } from '@polkadot/util';

export async function handleTransfer (
  transactionObject: TransactionConfig,
  changeValue: string,
  networkKey: string,
  privateKey: string,
  web3ApiMap: Record<string, Web3>,
  callback: (data: ResponseTransfer) => void) {
  const web3Api = web3ApiMap[networkKey];
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
        let fee = null;

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

export async function makeEVMTransfer (
  networkKey: string,
  to: string,
  privateKey: string,
  value: string,
  transferAll: boolean,
  web3ApiMap: Record<string, Web3>,
  callback: (data: ResponseTransfer) => void): Promise<void> {
  const [transactionObject, changeValue] = await getEVMTransactionObject(networkKey, to, value, transferAll, web3ApiMap);

  await handleTransfer(transactionObject, changeValue, networkKey, privateKey, web3ApiMap, callback);
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

export async function makeERC20Transfer (
  assetAddress: string,
  networkKey: string,
  from: string,
  to: string,
  privateKey: string,
  value: string,
  transferAll: boolean,
  web3ApiMap: Record<string, Web3>,
  callback: (data: ResponseTransfer) => void) {
  const [transactionObject, changeValue] = await getERC20TransactionObject(assetAddress, networkKey, from, to, value, transferAll, web3ApiMap);

  await handleTransfer(transactionObject, changeValue, networkKey, privateKey, web3ApiMap, callback);
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
