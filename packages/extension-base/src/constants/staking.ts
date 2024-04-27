// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const PREDEFINED_STAKING_POOL: Record<string, number> = {
  kusama: 80,
  polkadot: 39,
  vara_network: 62,
  aleph: 82,
  availTuringTest: 11
};

export const PREDEFINED_EARNING_POOL: Record<string, number[]> = {
  polkadot: [39],
  kusama: [80],
  vara_network: [62, 29, 50],
  aleph: [82],
  availTuringTest: [11]
};

export const MAX_NOMINATIONS = '16';
