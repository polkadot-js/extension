"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _polymeshTypes = _interopRequireDefault(require("@polymathnetwork/polymesh-types"));

// Copyright 2017-2022 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0
const definitions = {
  rpc: _polymeshTypes.default.rpc,
  types: [{
    // on all versions
    minmax: [0, undefined],
    types: _polymeshTypes.default.types
  }]
};
var _default = definitions;
exports.default = _default;