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
      Attestation: {
        attester: 'AccountId',
        ctypeHash: 'Hash',
        delegationId: 'Option<DelegationNodeId>',
        revoked: 'bool'
      },
      Balance: 'u128',
      DelegationNode: {
        owner: 'AccountId',
        parent: 'Option<DelegationNodeId>',
        permissions: 'Permissions',
        revoked: 'bool',
        rootId: 'DelegationNodeId'
      },
      DelegationNodeId: 'Hash',
      DelegationRoot: {
        ctypeHash: 'Hash',
        owner: 'AccountId',
        revoked: 'bool'
      },
      DidRecord: {
        boxKey: 'Hash',
        docRef: 'Option<Vec<u8>>',
        signKey: 'Hash'
      },
      Index: 'u64',
      Permissions: 'u32',
      PublicBoxKey: 'Hash',
      PublicSigningKey: 'Hash',
      Signature: 'MultiSignature'
    }
  }]
};
var _default = definitions;
exports.default = _default;