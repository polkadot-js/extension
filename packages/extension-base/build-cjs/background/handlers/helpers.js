"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withErrorLog = withErrorLog;

// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0
function withErrorLog(fn) {
  try {
    const p = fn();

    if (p && typeof p === 'object' && typeof p.catch === 'function') {
      p.catch(console.error);
    }
  } catch (e) {
    console.error(e);
  }
}