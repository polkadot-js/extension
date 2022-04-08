"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _typedefs = require("@phala/typedefs");

var _crustMaxwell = _interopRequireDefault(require("./crust-maxwell"));

// Copyright 2017-2022 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0
// alphabetical, based on the actual displayed name
var _default = { ..._typedefs.typesChain,
  'Crust Maxwell': _crustMaxwell.default
};
exports.default = _default;