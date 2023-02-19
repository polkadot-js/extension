// Copyright 2017-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import nodeCrypto from 'crypto';

import { TextDecoder } from '@polkadot/x-textencoder/node';
import { TextEncoder } from '@polkadot/x-textencoder/node';

window.crypto ??= {
  getRandomValues: function (buffer) {
    return nodeCrypto.randomFillSync(buffer);
  }
};

global.TextDecoder ??= TextDecoder;
global.TextEncoder ??= TextEncoder;
