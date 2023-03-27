// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type TransakTokenInfo = {
  transakNetwork: string,
  chain: string,
  symbol: string,
  slug: string,
  support: 'ETHEREUM' | 'SUBSTRATE'
}

export const PREDEFINED_TRANSAK_TOKEN: Record<string, TransakTokenInfo> = {
  'polkadot-NATIVE-DOT': {
    transakNetwork: 'mainnet',
    chain: 'polkadot',
    slug: 'polkadot-NATIVE-DOT',
    symbol: 'DOT',
    support: 'SUBSTRATE'
  },
  'kusama-NATIVE-KSM': {
    transakNetwork: 'mainnet',
    chain: 'kusama',
    slug: 'kusama-NATIVE-KSM',
    symbol: 'KSM',
    support: 'SUBSTRATE'
  },
  'astar-NATIVE-ASTR': {
    transakNetwork: 'mainnet',
    chain: 'astar',
    slug: 'astar-NATIVE-ASTR',
    symbol: 'ASTR',
    support: 'SUBSTRATE'
  },
  'moonbeam-NATIVE-GLMR': {
    transakNetwork: 'mainnet',
    chain: 'moonbeam',
    slug: 'moonbeam-NATIVE-GLMR',
    symbol: 'GLMR',
    support: 'ETHEREUM'
  },
  'moonriver-NATIVE-MOVR': {
    transakNetwork: 'moonriver',
    chain: 'moonriver',
    slug: 'moonriver-NATIVE-MOVR',
    symbol: 'MOVR',
    support: 'ETHEREUM'
  },
  'ethereum-NATIVE-ETH': {
    transakNetwork: 'ethereum',
    chain: 'ethereum',
    slug: 'ethereum-NATIVE-ETH',
    symbol: 'ETH',
    support: 'ETHEREUM'
  },
  'binance-NATIVE-BNB': {
    transakNetwork: 'bsc',
    chain: 'binance',
    slug: 'binance-NATIVE-BNB',
    symbol: 'BNB',
    support: 'ETHEREUM'
  }
};
