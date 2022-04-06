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
      RelayChainAccountId: 'H256',
      RoundIndex: 'u32',
      SettingStruct: {
        bond_duration: 'u32',
        blocks_per_round: 'u32',
        desired_target: 'u32'
      },
      Bond: {
        owner: 'AccountId',
        amount: 'Balance'
      },
      UnBondChunk: {
        value: 'Balance',
        round: 'u32'
      },
      StakingNominators: {
        nominations: 'Vec<Bond>',
        total: 'Balance',
        unbonding: 'Vec<UnBondChunk>',
        claimed_rewards: 'Vec<u32>'
      }
    }
  }]
};
var _default = definitions;
exports.default = _default;