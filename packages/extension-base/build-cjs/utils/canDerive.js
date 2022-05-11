"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.canDerive = canDerive;

// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0
function canDerive(type) {
  return !!type && ['ed25519', 'sr25519', 'ecdsa', 'ethereum'].includes(type);
}