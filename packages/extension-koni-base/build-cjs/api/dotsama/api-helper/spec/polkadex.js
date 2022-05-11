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
      BurnTxDetails: {
        approvals: 'u32',
        approvers: 'Vec<AccountId>'
      },
      OrmlVestingSchedule: {
        start: 'BlockNumber',
        period: 'BlockNumber',
        periodCount: 'u32',
        perPeriod: 'Compact<Balance>'
      },
      VestingScheduleOf: 'OrmlVestingSchedule'
    }
  }]
};
var _default = definitions;
exports.default = _default;