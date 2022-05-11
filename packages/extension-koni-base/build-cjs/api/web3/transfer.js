"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getERC20TransactionObject = getERC20TransactionObject;
exports.getEVMTransactionObject = getEVMTransactionObject;
exports.handleTransfer = handleTransfer;
exports.makeERC20Transfer = makeERC20Transfer;
exports.makeEVMTransfer = makeEVMTransfer;

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _web = require("@polkadot/extension-koni-base/api/web3/web3");

var _util = require("@polkadot/util");

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
async function handleTransfer(transactionObject, changeValue, networkKey, privateKey, callback) {
  const web3Api = (0, _web.getWeb3Api)(networkKey);
  const signedTransaction = await web3Api.eth.accounts.signTransaction(transactionObject, privateKey);
  const response = {
    step: _KoniTypes.TransferStep.READY,
    errors: [],
    extrinsicStatus: undefined,
    data: {}
  };

  try {
    (signedTransaction === null || signedTransaction === void 0 ? void 0 : signedTransaction.rawTransaction) && web3Api.eth.sendSignedTransaction(signedTransaction.rawTransaction).on('transactionHash', function (hash) {
      console.log('transactionHash', hash);
      response.step = _KoniTypes.TransferStep.READY;
      response.extrinsicHash = hash;
      callback(response);
    }) // .on('confirmation', function (confirmationNumber, receipt) {
    //   console.log('confirmation', confirmationNumber, receipt);
    //   response.step = TransferStep.PROCESSING;
    //   response.data = receipt;
    //   callback(response);
    // })
    .on('receipt', function (receipt) {
      response.step = _KoniTypes.TransferStep.SUCCESS;
      response.txResult = {
        change: changeValue || '0',
        fee: (receipt.gasUsed * receipt.effectiveGasPrice).toString()
      };
      callback(response);
    }).catch(e => {
      var _response$errors;

      response.step = _KoniTypes.TransferStep.ERROR;
      (_response$errors = response.errors) === null || _response$errors === void 0 ? void 0 : _response$errors.push({
        code: _KoniTypes.TransferErrorCode.TRANSFER_ERROR,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        message: e.message
      });
      callback(response);
    });
  } catch (error) {
    var _response$errors2;

    response.step = _KoniTypes.TransferStep.ERROR;
    (_response$errors2 = response.errors) === null || _response$errors2 === void 0 ? void 0 : _response$errors2.push({
      code: _KoniTypes.TransferErrorCode.TRANSFER_ERROR,
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      message: error.message
    });
    callback(response);
  }
}

async function getEVMTransactionObject(networkKey, to, value, transferAll) {
  const web3Api = (0, _web.getWeb3Api)(networkKey);
  const gasPrice = await web3Api.eth.getGasPrice();
  const transactionObject = {
    gasPrice: gasPrice,
    to: to
  };
  const gasLimit = await web3Api.eth.estimateGas(transactionObject);
  transactionObject.gas = gasLimit;
  const estimateFee = parseInt(gasPrice) * gasLimit;
  transactionObject.value = transferAll ? new _util.BN(value).add(new _util.BN(estimateFee).neg()) : value;
  return [transactionObject, transactionObject.value.toString(), estimateFee.toString()];
}

async function makeEVMTransfer(networkKey, to, privateKey, value, transferAll, callback) {
  const [transactionObject, changeValue] = await getEVMTransactionObject(networkKey, to, value, transferAll);
  await handleTransfer(transactionObject, changeValue, networkKey, privateKey, callback);
}

async function getERC20TransactionObject(assetAddress, networkKey, from, to, value, transferAll) {
  const web3Api = (0, _web.getWeb3Api)(networkKey);
  const erc20Contract = (0, _web.getERC20Contract)(networkKey, assetAddress);
  let freeAmount = new _util.BN(0);
  let transferValue = value;

  if (transferAll) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const bal = await erc20Contract.methods.balanceOf(from).call();
    freeAmount = new _util.BN(bal || '0');
    transferValue = freeAmount.toString() || '0';
  }

  function generateTransferData(to, transferValue) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    return erc20Contract.methods.transfer(to, transferValue).encodeABI();
  }

  const transferData = generateTransferData(to, transferValue);
  const gasPrice = await web3Api.eth.getGasPrice();
  const transactionObject = {
    gasPrice: gasPrice,
    from,
    to: assetAddress,
    data: transferData
  };
  const gasLimit = await web3Api.eth.estimateGas(transactionObject);
  transactionObject.gas = gasLimit;
  const estimateFee = parseInt(gasPrice) * gasLimit;

  if (transferAll) {
    transferValue = new _util.BN(freeAmount).toString();
    transactionObject.data = generateTransferData(to, transferValue);
  }

  return [transactionObject, transferValue, estimateFee.toString()];
}

async function makeERC20Transfer(assetAddress, networkKey, from, to, privateKey, value, transferAll, callback) {
  const [transactionObject, changeValue] = await getERC20TransactionObject(assetAddress, networkKey, from, to, value, transferAll);
  await handleTransfer(transactionObject, changeValue, networkKey, privateKey, callback);
}