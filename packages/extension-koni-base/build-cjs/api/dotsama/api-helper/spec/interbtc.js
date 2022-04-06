"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getBalance = getBalance;

var _interbtcTypes = _interopRequireDefault(require("@interlay/interbtc-types"));

var _rxjs = require("rxjs");

var _util = require("@polkadot/api-derive/util");

var _types = require("@polkadot/types");

var _util2 = require("@polkadot/util");

// Copyright 2017-2022 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
function balanceOf(number) {
  return new _types.U128(new _types.TypeRegistry(), number);
}

function defaultAccountBalance() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    accountNonce: new _util2.BN(1),
    additional: [],
    availableBalance: balanceOf(0),
    freeBalance: balanceOf(0),
    lockedBalance: balanceOf(0),
    lockedBreakdown: [],
    namedReserves: [],
    reservedBalance: balanceOf(0)
  };
}

function getBalance(instanceId, api) {
  const nativeToken = api.registry.chainTokens[0] || _util2.formatBalance.getDefaults().unit;

  return (0, _util.memo)(instanceId, account => (0, _rxjs.combineLatest)([api.query.tokens.accounts(account, {
    Token: nativeToken
  })]).pipe((0, _rxjs.map)(_ref => {
    let [data] = _ref;
    return { ...defaultAccountBalance(),
      accountId: api.registry.createType('AccountId', account),
      availableBalance: api.registry.createType('Balance', data.free.sub(data.frozen)),
      freeBalance: data.free,
      lockedBalance: data.frozen,
      reservedBalance: data.reserved
    };
  })));
}

const definitions = {
  derives: {
    balances: {
      all: getBalance
    }
  },
  ..._interbtcTypes.default
};
var _default = definitions;
exports.default = _default;