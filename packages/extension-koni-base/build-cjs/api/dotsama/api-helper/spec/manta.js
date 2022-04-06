"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// Copyright 2017-2022 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0
// structs need to be in order

/* eslint-disable sort-keys */
const definitions = {
  types: [{
    // on all versions
    minmax: [0, undefined],
    types: {
      CurrencyId: {
        _enum: ['MA']
      },
      CurrencyIdOf: 'CurrencyId',
      Amount: 'i128',
      AmountOf: 'Amount',
      AccountInfo: 'AccountInfoWithDualRefCount'
    }
  }]
};
var _default = definitions;
exports.default = _default;