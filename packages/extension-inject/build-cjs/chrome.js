"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.chrome = void 0;

var _xGlobal = require("@polkadot/x-global");

// Copyright 2019-2022 @polkadot/extension-inject authors & contributors
// SPDX-License-Identifier: Apache-2.0
const chrome = (0, _xGlobal.extractGlobal)('chrome', _xGlobal.xglobal.browser);
exports.chrome = chrome;