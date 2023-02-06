// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EXTENSION_PREFIX } from '@subwallet/extension-base/defaults';

let counter = 0;

export const getTransactionId = (network: string, address: string): string => {
  return `${EXTENSION_PREFIX}.${address}.${network}.${Date.now()}.${++counter}`;
};
