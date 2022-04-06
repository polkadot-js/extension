"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _wrapBytes = require("@polkadot/extension-dapp/wrapBytes");

var _util = require("@polkadot/util");

// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0
class RequestBytesSign {
  constructor(payload) {
    this.payload = payload;
  }

  sign(_registry, pair) {
    return {
      signature: (0, _util.u8aToHex)(pair.sign((0, _wrapBytes.wrapBytes)(this.payload.data)))
    };
  }

}

exports.default = RequestBytesSign;