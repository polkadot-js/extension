"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.balanceOf = balanceOf;
exports.typesFromDefs = typesFromDefs;

var _types = require("@polkadot/types");

// Copyright 2017-2022 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0
function balanceOf(number) {
  return new _types.U128(new _types.TypeRegistry(), number);
}

function typesFromDefs(definitions) {
  return Object.values(definitions).reduce((res, _ref) => {
    let {
      types
    } = _ref;
    return { ...res,
      ...types
    };
  }, {});
}