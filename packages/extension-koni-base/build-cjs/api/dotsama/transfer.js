"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.estimateFee = estimateFee;
exports.makeTransfer = makeTransfer;

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _handlers = require("@polkadot/extension-koni-base/background/handlers");

var _util = require("@polkadot/util");

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
async function estimateFee(networkKey, fromKeypair, to, value, transferAll) {
  const apiProps = await _handlers.dotSamaAPIMap[networkKey].isReady;

  if (fromKeypair === undefined) {
    return '0';
  }

  if (transferAll) {
    const paymentInfo = await apiProps.api.tx.balances.transferAll(to, false).paymentInfo(fromKeypair);
    return paymentInfo.partialFee.toString();
  } else if (value) {
    const paymentInfo = await apiProps.api.tx.balances.transfer(to, new _util.BN(value)).paymentInfo(fromKeypair);
    return paymentInfo.partialFee.toString();
  }

  return '0';
}

async function makeTransfer(networkKey, to, fromKeypair, value, transferAll, callback) {
  const apiProps = await _handlers.dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api; // @ts-ignore

  const {
    nonce
  } = await api.query.system.account(fromKeypair.address);
  let transfer;

  if (transferAll) {
    transfer = api.tx.balances.transferAll(to, false);
  } else {
    transfer = api.tx.balances.transfer(to, new _util.BN(value));
  }

  const response = {
    step: _KoniTypes.TransferStep.READY,
    errors: [],
    extrinsicStatus: undefined,
    data: {}
  };

  function updateResponseByEvents(response, events) {
    events.forEach(_ref => {
      let {
        event: {
          method,
          section,
          data: [error, info]
        }
      } = _ref;
      // @ts-ignore
      const isFailed = section === 'system' && method === 'ExtrinsicFailed'; // @ts-ignore

      const isSuccess = section === 'system' && method === 'ExtrinsicSuccess';
      console.log('Transaction final: ', isFailed, isSuccess);

      if (isFailed) {
        response.step = _KoniTypes.TransferStep.ERROR; // @ts-ignore

        if (error.isModule) {
          var _response$errors;

          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const decoded = api.registry.findMetaError(error.asModule);
          const {
            docs,
            method,
            section
          } = decoded;
          const errorMesssage = docs.join(' ');
          console.log(`${section}.${method}: ${errorMesssage}`);
          response.data = {
            section,
            method,
            message: errorMesssage,
            info
          };
          (_response$errors = response.errors) === null || _response$errors === void 0 ? void 0 : _response$errors.push({
            code: _KoniTypes.TransferErrorCode.TRANSFER_ERROR,
            message: errorMesssage
          });
        } else {
          var _response$errors2;

          // Other, CannotLookup, BadOrigin, no extra info
          console.log(error.toString());
          (_response$errors2 = response.errors) === null || _response$errors2 === void 0 ? void 0 : _response$errors2.push({
            code: _KoniTypes.TransferErrorCode.TRANSFER_ERROR,
            message: error.toString()
          });
        }
      } else if (isSuccess) {
        response.step = _KoniTypes.TransferStep.SUCCESS;
      }
    });
  } // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment


  await transfer.signAndSend(fromKeypair, {
    nonce
  }, _ref2 => {
    let {
      events = [],
      status
    } = _ref2;
    console.log('Transaction status:', status.type, status.hash.toHex());
    response.extrinsicStatus = status.type;

    if (status.isBroadcast) {
      response.step = _KoniTypes.TransferStep.START;
    }

    if (status.isInBlock) {
      const blockHash = status.asInBlock.toHex();
      response.step = _KoniTypes.TransferStep.PROCESSING;
      response.data = {
        block: blockHash,
        status: status.type
      }; // updateResponseByEvents(response, events);

      callback(response);
    } else if (status.isFinalized) {
      var _events$;

      const blockHash = status.asFinalized.toHex();
      response.data = {
        block: blockHash,
        status: status.type
      };
      updateResponseByEvents(response, events);
      const extrinsicIndex = parseInt((_events$ = events[0]) === null || _events$ === void 0 ? void 0 : _events$.phase.asApplyExtrinsic.toString()); // Get extrinsic hash from network

      api.rpc.chain.getBlock(blockHash).then(blockQuery => {
        response.extrinsicHash = blockQuery.block.extrinsics[extrinsicIndex].hash.toHex();
        callback(response);
      }).catch(e => {
        console.error('Transaction errors:', e);
        callback(response);
      });
    } else {
      callback(response);
    }
  });
}