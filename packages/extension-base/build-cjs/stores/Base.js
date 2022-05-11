"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

// Copyright 2019-2022 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
const lastError = type => {
  const error = chrome.runtime.lastError;

  if (error) {
    console.error(`BaseStore.${type}:: runtime.lastError:`, error);
  }
};

class BaseStore {
  #prefix;

  constructor(prefix) {
    this.#prefix = prefix ? `${prefix}:` : '';
  }

  getPrefix() {
    return this.#prefix;
  }

  all(update) {
    this.allMap(map => {
      Object.entries(map).forEach(_ref => {
        let [key, value] = _ref;
        update(key, value);
      });
    });
  }

  allMap(update) {
    chrome.storage.local.get(null, result => {
      lastError('all');
      const entries = Object.entries(result);
      const map = {};

      for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i];

        if (key.startsWith(this.#prefix)) {
          map[key.replace(this.#prefix, '')] = value;
        }
      }

      update(map);
    });
  }

  get(_key, update) {
    const key = `${this.#prefix}${_key}`;
    chrome.storage.local.get([key], result => {
      lastError('get');
      update(result[key]);
    });
  }

  remove(_key, update) {
    const key = `${this.#prefix}${_key}`;
    chrome.storage.local.remove(key, () => {
      lastError('remove');
      update && update();
    });
  }

  set(_key, value, update) {
    const key = `${this.#prefix}${_key}`;
    chrome.storage.local.set({
      [key]: value
    }, () => {
      lastError('set');
      update && update();
    });
  }

}

exports.default = BaseStore;