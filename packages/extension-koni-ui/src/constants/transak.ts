// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransakNetwork } from '@subwallet/extension-base/background/KoniTypes';

export const PREDEFINED_TRANSAK_NETWORK: Record<string, TransakNetwork> = {
  polkadot: {
    networks: ['mainnet'],
    tokens: ['DOT']
  },
  kusama: {
    networks: ['mainnet'],
    tokens: ['KSM']
  },
  astar: {
    networks: ['astar'],
    tokens: ['ASTR']
  },
  shiden: {
    networks: ['Shiden'],
    tokens: ['SDN']
  },
  moonbeam: {
    networks: ['mainnet'],
    tokens: ['GLMR']
  },
  moonriver: {
    networks: ['moonriver'],
    tokens: ['MOVR']
  }
};
