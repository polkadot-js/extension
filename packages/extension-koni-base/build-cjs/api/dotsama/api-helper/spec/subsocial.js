"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _definitions = _interopRequireDefault(require("@subsocial/types/substrate/interfaces/subsocial/definitions"));

// Copyright 2017-2022 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0
// We only load the definitions here explicitly - if we try to go via
//   import { types } from '@subsocial/types/substrate';
// we end up with multiple version of types/API
var _default = _definitions.default;
exports.default = _default;