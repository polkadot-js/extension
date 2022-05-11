"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0
// External to class, this.# is not private enough (yet)
let sendRequest;

class Accounts {
  constructor(_sendRequest) {
    sendRequest = _sendRequest;
  }

  get(anyType) {
    return sendRequest('pub(accounts.listV2)', {
      anyType
    });
  }

  subscribe(cb) {
    sendRequest('pub(accounts.subscribeV2)', null, cb).catch(error => console.error(error));
    return () => {// FIXME we need the ability to unsubscribe
    };
  }

}

exports.default = Accounts;