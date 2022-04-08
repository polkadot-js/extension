"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defaults = require("@polkadot/extension-base/defaults");

var _SubscribableStore = _interopRequireDefault(require("@polkadot/extension-koni-base/stores/SubscribableStore"));

// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0
const lastError = type => {
  const error = chrome.runtime.lastError;

  if (error) {
    console.error(`TransactionHistoryStore.${type}:: runtime.lastError:`, error);
  }
};

class TransactionHistoryStore extends _SubscribableStore.default {
  constructor() {
    super(_defaults.EXTENSION_PREFIX ? `${_defaults.EXTENSION_PREFIX}transaction_history` : null);
  }

  getByMultiKeys(_keys, update) {
    const keys = _keys.map(k => `${this.getPrefix()}${k}`);

    chrome.storage.local.get(keys, result => {
      lastError('getByMultiKey');
      const items = [];
      keys.forEach(k => {
        if (result[k]) {
          items.push(...result[k]);
        }
      });
      update(items);
    });
  }

}

exports.default = TransactionHistoryStore;