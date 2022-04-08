"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// Copyright 2017-2022 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable sort-keys */
const definitions = {
  types: [{
    // on all versions
    minmax: [0, undefined],
    types: {
      ParachainAccountIdOf: 'AccountId',
      Proof: {
        leafHash: 'Hash',
        sortedHashes: 'Vec<Hash>'
      },
      ProxyType: {
        _enum: ['Any', 'NonTransfer', 'Governance', '_Staking', 'NonProxy']
      },
      RelayChainAccountId: 'AccountId',
      RootHashOf: 'Hash'
    }
  }]
};
var _default = definitions;
exports.default = _default;