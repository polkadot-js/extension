// Copyright 2017-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

const nodeCrypto = require('crypto');
const { TextDecoder } = require('@polkadot/x-textencoder/node');
const { TextEncoder } = require('@polkadot/x-textencoder/node');

Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: function (buffer) {
      return nodeCrypto.randomFillSync(buffer);
    }
  }
});

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
