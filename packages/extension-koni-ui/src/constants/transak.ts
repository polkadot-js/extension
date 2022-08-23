// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransakNetwork } from '@subwallet/extension-base/background/KoniTypes';

export const PREDEFINED_TRANSAK_NETWORK: Record<string, TransakNetwork> = {
  polkadot: {
    network: 'mainnet',
    defaultToken: 'DOT',
    tokens: ['DOT']
  },
  kusama: {
    network: 'mainnet',
    defaultToken: 'KSM',
    tokens: ['KSM']
  },
  astar: {
    network: 'astar',
    defaultToken: 'ASTR',
    tokens: ['ASTR']
  },
  shiden: {
    network: 'Shiden',
    defaultToken: 'SDN',
    tokens: ['SDN']
  },
  moonbeam: {
    network: 'mainnet',
    defaultToken: 'GLMR',
    tokens: ['GLMR']
  },
  moonriver: {
    network: 'moonriver',
    defaultToken: 'MOVR',
    tokens: ['MOVR']
  }
};
