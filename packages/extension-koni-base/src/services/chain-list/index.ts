// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint @typescript-eslint/no-var-requires: "off" */

import { _ChainInfo } from '@subwallet/extension-koni-base/services/chain-list/types';

export const ChainInfoMap = require('./data/ChainInfo.json') as Record<string, _ChainInfo>;

export enum COMMON_CHAIN_SLUGS {
  POLKADOT = 'polkadot',
  KUSAMA = 'kusama',
  MOONBEAM = 'moonbeam'
}

export const _DEFAULT_CHAINS = [
  COMMON_CHAIN_SLUGS.POLKADOT as string,
  COMMON_CHAIN_SLUGS.KUSAMA as string
];
