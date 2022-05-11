"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Accounts = _interopRequireDefault(require("./Accounts"));

var _Metadata = _interopRequireDefault(require("./Metadata"));

var _PostMessageProvider = _interopRequireDefault(require("./PostMessageProvider"));

var _Signer = _interopRequireDefault(require("./Signer"));

// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0
class _default {
  constructor(sendRequest) {
    this.accounts = new _Accounts.default(sendRequest);
    this.metadata = new _Metadata.default(sendRequest);
    this.provider = new _PostMessageProvider.default(sendRequest);
    this.signer = new _Signer.default(sendRequest);
  }

}

exports.default = _default;