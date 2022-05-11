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
      Record: 'Vec<u8>',
      Technics: 'Vec<u8>',
      Economics: '{}',
      Report: {
        index: 'LiabilityIndex',
        sender: 'AccountId',
        payload: 'Vec<u8>',
        signature: 'MultiSignature'
      },
      ReportFor: 'Report',
      Agreement: {
        technics: 'Technics',
        economics: 'Economics',
        promisee: 'AccountId',
        promisor: 'AccountId',
        promisee_signature: 'MultiSignature',
        promisor_signature: 'MultiSignature'
      },
      LiabilityIndex: 'u32'
    }
  }]
};
var _default = definitions;
exports.default = _default;