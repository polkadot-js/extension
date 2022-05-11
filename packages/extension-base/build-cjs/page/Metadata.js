"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0
// External to class, this.# is not private enough (yet)
let sendRequest;

class Metadata {
  constructor(_sendRequest) {
    sendRequest = _sendRequest;
  }

  get() {
    return sendRequest('pub(metadata.list)');
  }

  provide(definition) {
    return sendRequest('pub(metadata.provide)', definition);
  }

}

exports.default = Metadata;