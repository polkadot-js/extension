// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';

export const chainProvider: Record<string, number> = {
  default: 0,
  ethereum: 0,
  polygon: 2,
  shidenEvm: 1,
  shiden: 1,
  ajunaPolkadot: 0,
  crabParachain: 1,
  astarEvm: 1,
  shibuya: 1,
  shibuyaEvm: 0
};

export const chainProviderBackup: Record<string, number> = {
  default: 1,
  pangolin: 0,
  moonbeam: 0,
  moonbase: 0,
  moonriver: 3,
  darwinia2: 2,
  crabParachain: 1
};

export const BIG_TEN = new BigN(10);
