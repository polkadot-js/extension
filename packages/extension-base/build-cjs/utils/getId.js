"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getId = getId;

var _defaults = require("../defaults");

// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0
let counter = 0;

function getId() {
  return `${_defaults.EXTENSION_PREFIX}.${Date.now()}.${++counter}`;
}