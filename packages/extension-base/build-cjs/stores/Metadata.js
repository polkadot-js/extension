"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defaults = require("../defaults");

var _Base = _interopRequireDefault(require("./Base"));

// Copyright 2019-2022 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
class MetadataStore extends _Base.default {
  constructor() {
    super(`${_defaults.EXTENSION_PREFIX}metadata`);
  }

}

exports.default = MetadataStore;