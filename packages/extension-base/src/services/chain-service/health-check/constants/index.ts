// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';

export const chainProvider: Record<string, number> = {
  default: 0,
  ethereum: 1,
  polygon: 2,
  shidenEvm: 2,
  shiden: 2,
  ajunaPolkadot: 1,
  crabParachain: 1
};

export const chainProviderBackup: Record<string, number> = {
  default: 1,
  pangolin: 0,
  moonbase: 0,
  moonriver: 3,
  darwinia2: 2,
  crabParachain: 0
};

export const BIG_TEN = new BigN(10);
