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
      LookupSource: 'MultiAddress',
      ClassId: 'u64',
      ClassInfoOf: 'ClassId',
      BalanceOf: 'Balance',
      BalanceReservableOf: 'BalanceOf',
      Moment: 'u64',
      Place: {
        spot: 'u32',
        payout: 'Balance'
      },
      Competitor: {
        vie_id: '[u8;16]',
        staked: 'bool',
        submitted_winner: 'bool'
      },
      Vie: {
        operator: 'AccountId',
        stake: 'Balance',
        places: 'Vec<Place>',
        time: 'Moment',
        competitors: 'Vec<AccountId>',
        memo: 'Vec<u8>'
      },
      VieOf: 'Vie',
      VieReq: {
        stake: 'Balance',
        places: 'Vec<Place>',
        competitors: 'Vec<AccountId>',
        memo: 'Vec<u8>'
      },
      VieRequestOf: 'VieReq',
      Participants: {
        AccountId: '[u8;16]'
      },
      Operators: {
        AccountId: '[u8;16]'
      },
      StandingReq: {
        competitor: 'AccountId',
        spot: 'u32'
      },
      PodiumReq: {
        champion: 'AccountId',
        podium: 'Vec<StandingReq>'
      },
      PodiumReqOf: 'PodiumReq',
      Trophy: {
        trophy: '[u8; 16]',
        competitors: 'Vec<AccountId>',
        stake: 'Balance',
        memo: 'Vec<u8>',
        time: 'u64',
        podium: 'Vec<StandingReq>'
      },
      TokenId: 'u64',
      TokenInfo: {
        metadata: 'Vec<u8>',
        owner: 'AccountId',
        data: 'Trophy'
      },
      TokenInfoOf: 'TokenInfo'
    }
  }]
};
var _default = definitions;
exports.default = _default;