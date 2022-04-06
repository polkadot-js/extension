"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rxjs = require("rxjs");

var _Base = _interopRequireDefault(require("@polkadot/extension-base/stores/Base"));

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
class SubscribableStore extends _Base.default {
  subject = new _rxjs.Subject();

  getSubject() {
    return this.subject;
  }

  set(_key, value, update) {
    super.set(_key, value, () => {
      this.subject.next(value);
      update && update();
    });
  }

}

exports.default = SubscribableStore;