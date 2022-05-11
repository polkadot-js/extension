"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkReferenceCount = checkReferenceCount;
exports.checkSupportTransfer = checkSupportTransfer;
exports.estimateFee = estimateFee;
exports.getExistentialDeposit = getExistentialDeposit;
exports.makeTransfer = makeTransfer;

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _apiHelper = require("@polkadot/extension-koni-base/api/dotsama/api-helper");

var _registry = require("@polkadot/extension-koni-base/api/dotsama/registry");

var _handlers = require("@polkadot/extension-koni-base/background/handlers");

var _util = require("@polkadot/util");

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
// import { getFreeBalance } from '@polkadot/extension-koni-base/api/dotsama/balance';
async function getExistentialDeposit(networkKey, token) {
  const apiProps = await _handlers.dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api;
  const tokenInfo = await (0, _registry.getTokenInfo)(networkKey, api, token);

  if (tokenInfo && tokenInfo.isMainToken) {
    var _api$consts, _api$consts$balances;

    if (api !== null && api !== void 0 && (_api$consts = api.consts) !== null && _api$consts !== void 0 && (_api$consts$balances = _api$consts.balances) !== null && _api$consts$balances !== void 0 && _api$consts$balances.existentialDeposit) {
      return api.consts.balances.existentialDeposit.toString();
    }
  }

  return '0';
}

function isRefCount(accountInfo) {
  return !!accountInfo.refcount;
}

async function checkReferenceCount(networkKey, address) {
  // todo: need update if ethereumChains is dynamic
  if (_apiHelper.ethereumChains.includes(networkKey)) {
    return false;
  }

  const apiProps = await _handlers.dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api; // @ts-ignore

  const accountInfo = await api.query.system.account(address);
  return accountInfo ? isRefCount(accountInfo) ? !accountInfo.refcount.isZero() : !accountInfo.consumers.isZero() : false;
}

async function checkSupportTransfer(networkKey, token) {
  // todo: need update if ethereumChains is dynamic
  if (_apiHelper.ethereumChains.includes(networkKey)) {
    return {
      supportTransfer: true,
      supportTransferAll: true
    };
  }

  const apiProps = await _handlers.dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;
  const result = {
    supportTransfer: false,
    supportTransferAll: false
  };

  if (!(isTxCurrenciesSupported || isTxBalancesSupported || isTxTokensSupported)) {
    return result;
  }

  const tokenInfo = await (0, _registry.getTokenInfo)(networkKey, api, token);

  if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken && isTxCurrenciesSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = false;
  } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo && isTxTokensSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (isTxBalancesSupported && (!tokenInfo || tokenInfo.isMainToken)) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  }

  return result;
}

async function estimateFee(networkKey, fromKeypair, to, value, transferAll, tokenInfo) {
  let fee = '0'; // eslint-disable-next-line

  let feeSymbol = undefined;

  if (fromKeypair === undefined) {
    return [fee, feeSymbol];
  }

  const apiProps = await _handlers.dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;

  if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken && isTxCurrenciesSupported) {
    // Note: currently 'karura', 'acala', 'acala_testnet' do not support transfer all
    // if (transferAll) {
    //   const freeBalanceString = await getFreeBalance(networkKey, fromKeypair.address, tokenInfo.symbol);
    //
    //   const paymentInfo = await api.tx.currencies
    //     .transfer(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, freeBalanceString)
    //     .paymentInfo(fromKeypair);
    //
    //   return paymentInfo.partialFee.toString();
    if (value) {
      const paymentInfo = await api.tx.currencies.transfer(to, tokenInfo.specialOption || {
        Token: tokenInfo.symbol
      }, value).paymentInfo(fromKeypair);
      fee = paymentInfo.partialFee.toString();
    }
  } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo && isTxTokensSupported) {
    if (transferAll) {
      const paymentInfo = await api.tx.tokens.transferAll(to, tokenInfo.specialOption || {
        Token: tokenInfo.symbol
      }, false).paymentInfo(fromKeypair);
      fee = paymentInfo.partialFee.toString();
    } else if (value) {
      const paymentInfo = await api.tx.tokens.transfer(to, tokenInfo.specialOption || {
        Token: tokenInfo.symbol
      }, new _util.BN(value)).paymentInfo(fromKeypair);
      fee = paymentInfo.partialFee.toString();
    }
  } else if (isTxBalancesSupported && (!tokenInfo || tokenInfo.isMainToken)) {
    if (transferAll) {
      const paymentInfo = await api.tx.balances.transferAll(to, false).paymentInfo(fromKeypair);
      fee = paymentInfo.partialFee.toString();
    } else if (value) {
      const paymentInfo = await api.tx.balances.transfer(to, new _util.BN(value)).paymentInfo(fromKeypair);
      fee = paymentInfo.partialFee.toString();
    }
  }

  return [fee, feeSymbol];
}

function getUnsupportedResponse() {
  return {
    step: _KoniTypes.TransferStep.ERROR,
    errors: [{
      code: _KoniTypes.TransferErrorCode.UNSUPPORTED,
      message: 'The transaction of current network is unsupported'
    }],
    extrinsicStatus: undefined,
    data: {}
  };
}

function updateResponseTxResult(networkKey, tokenInfo, response, records) {
  if (!response.txResult) {
    response.txResult = {
      change: '0'
    };
  }

  let isFeeUseMainTokenSymbol = true;

  for (let index = 0; index < records.length; index++) {
    const record = records[index];

    if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken) {
      if (record.event.section === 'currencies' && record.event.method.toLowerCase() === 'transferred') {
        if (index === 0) {
          var _record$event$data$;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          response.txResult.fee = ((_record$event$data$ = record.event.data[3]) === null || _record$event$data$ === void 0 ? void 0 : _record$event$data$.toString()) || '0';
          response.txResult.feeSymbol = tokenInfo.symbol;
          isFeeUseMainTokenSymbol = false;
        } else {
          var _record$event$data$2;

          response.txResult.change = ((_record$event$data$2 = record.event.data[3]) === null || _record$event$data$2 === void 0 ? void 0 : _record$event$data$2.toString()) || '0';
          response.txResult.changeSymbol = tokenInfo.symbol;
        }
      }
    } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo) {
      if (record.event.section === 'tokens' && record.event.method.toLowerCase() === 'transfer') {
        var _record$event$data$3;

        response.txResult.change = ((_record$event$data$3 = record.event.data[3]) === null || _record$event$data$3 === void 0 ? void 0 : _record$event$data$3.toString()) || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else {
      if (record.event.section === 'balances' && record.event.method.toLowerCase() === 'transfer') {
        var _record$event$data$4;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        response.txResult.change = ((_record$event$data$4 = record.event.data[2]) === null || _record$event$data$4 === void 0 ? void 0 : _record$event$data$4.toString()) || '0';
      }
    }

    if (isFeeUseMainTokenSymbol && record.event.section === 'balances' && record.event.method.toLowerCase() === 'withdraw') {
      var _record$event$data$5;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      response.txResult.fee = ((_record$event$data$5 = record.event.data[1]) === null || _record$event$data$5 === void 0 ? void 0 : _record$event$data$5.toString()) || '0';
    }
  }
}

async function makeTransfer(networkKey, to, fromKeypair, value, transferAll, tokenInfo, callback) {
  const apiProps = await _handlers.dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api;
  const fromAddress = fromKeypair.address; // @ts-ignore

  const {
    nonce
  } = await api.query.system.account(fromAddress); // @ts-ignore

  let transfer;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;

  if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken && isTxCurrenciesSupported) {
    if (transferAll) {// currently Acala, Karura, Acala testnet do not have transfer all method for sub token
    } else if (value) {
      transfer = api.tx.currencies.transfer(to, tokenInfo.specialOption || {
        Token: tokenInfo.symbol
      }, value);
    }
  } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo && isTxTokensSupported) {
    if (transferAll) {
      transfer = api.tx.tokens.transferAll(to, tokenInfo.specialOption || {
        Token: tokenInfo.symbol
      }, false);
    } else if (value) {
      transfer = api.tx.tokens.transfer(to, tokenInfo.specialOption || {
        Token: tokenInfo.symbol
      }, new _util.BN(value));
    }
  } else if (isTxBalancesSupported && (!tokenInfo || tokenInfo.isMainToken)) {
    if (transferAll) {
      transfer = api.tx.balances.transferAll(to, false);
    } else if (value) {
      transfer = api.tx.balances.transfer(to, new _util.BN(value));
    }
  }

  if (!transfer) {
    callback(getUnsupportedResponse());
    return;
  }

  const response = {
    step: _KoniTypes.TransferStep.READY,
    errors: [],
    extrinsicStatus: undefined,
    data: {}
  };

  function updateResponseByEvents(response, records) {
    records.forEach(record => {
      const {
        event: {
          method,
          section,
          data: [error]
        }
      } = record; // @ts-ignore

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
          const errorMessage = docs.join(' ');
          console.log(`${section}.${method}: ${errorMessage}`);
          response.data = {
            section,
            method,
            message: errorMessage
          };
          (_response$errors = response.errors) === null || _response$errors === void 0 ? void 0 : _response$errors.push({
            code: _KoniTypes.TransferErrorCode.TRANSFER_ERROR,
            message: errorMessage
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
    updateResponseTxResult(networkKey, tokenInfo, response, records);
  } // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment


  await transfer.signAndSend(fromKeypair, {
    nonce
  }, _ref => {
    let {
      events = [],
      status
    } = _ref;
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
      };
      callback(response);
      updateResponseByEvents(response, events); // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment

      response.extrinsicHash = transfer.hash.toHex();
      callback(response); // const extrinsicIndex = parseInt(events[0]?.phase.asApplyExtrinsic.toString());
      //
      // // Get extrinsic hash from network
      // api.rpc.chain.getBlock(blockHash)
      //   .then((blockQuery: SignedBlockWithJustifications) => {
      //     response.extrinsicHash = blockQuery.block.extrinsics[extrinsicIndex].hash.toHex();
      //     callback(response);
      //   })
      //   .catch((e) => {
      //     console.error('Transaction errors:', e);
      //     callback(response);
      //   });
    } else if (status.isFinalized) {
      const blockHash = status.asFinalized.toHex();
      response.isFinalized = true;
      response.data = {
        block: blockHash,
        status: status.type
      }; // todo: may do something here

      callback(response);
    } else {
      callback(response);
    }
  });
}