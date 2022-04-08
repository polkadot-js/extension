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
      Difficulty: 'U256',
      DifficultyAndTimestamp: {
        difficulty: 'Difficulty',
        timestamp: 'Moment'
      },
      Era: {
        genesisBlockHash: 'H256',
        finalBlockHash: 'H256',
        finalStateRoot: 'H256'
      },
      RefCount: 'u8'
    }
  }]
};
var _default = definitions;
exports.default = _default;