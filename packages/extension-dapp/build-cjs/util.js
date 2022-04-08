"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.documentReadyPromise = documentReadyPromise;

// Copyright 2019-2022 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0
function documentReadyPromise(creator) {
  return new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve(creator());
    } else {
      window.addEventListener('load', () => resolve(creator()));
    }
  });
}