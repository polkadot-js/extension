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
      Address: 'MultiAddress',
      Enclave: {
        mrenclave: 'Hash',
        pubkey: 'AccountId',
        timestamp: 'u64',
        url: 'Text'
      },
      LookupSource: 'MultiAddress',
      Request: {
        cyphertext: 'Vec<u8>',
        shard: 'ShardIdentifier'
      },
      ShardIdentifier: 'Hash'
    }
  }]
};
var _default = definitions;
exports.default = _default;