"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wrapBytes = exports.unwrapBytes = exports.isWrapped = exports.PREFIX = exports.POSTFIX = exports.ETHEREUM = void 0;

var _util = require("@polkadot/util");

// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0
const ETHEREUM = _util.U8A_WRAP_ETHEREUM;
exports.ETHEREUM = ETHEREUM;
const POSTFIX = _util.U8A_WRAP_POSTFIX;
exports.POSTFIX = POSTFIX;
const PREFIX = _util.U8A_WRAP_PREFIX;
exports.PREFIX = PREFIX;
const isWrapped = _util.u8aIsWrapped;
exports.isWrapped = isWrapped;
const unwrapBytes = _util.u8aUnwrapBytes;
exports.unwrapBytes = unwrapBytes;
const wrapBytes = _util.u8aWrapBytes;
exports.wrapBytes = wrapBytes;