// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type TransakTokenInfo = {
  transakNetwork: string,
  chain: string,
  symbol: string,
  key: string,
  support: 'ETHEREUM' | 'SUBSTRATE'
}

export const PREDEFINED_TRANSAK_TOKEN: Record<string, TransakTokenInfo> = {
  DOT: {
    transakNetwork: 'mainnet',
    chain: 'polkadot',
    key: 'DOT|polkadot|mainnet',
    symbol: 'DOT',
    support: 'SUBSTRATE'
  },
  KSM: {
    transakNetwork: 'mainnet',
    chain: 'kusama',
    key: 'KSM|kusama|mainnet',
    symbol: 'KSM',
    support: 'SUBSTRATE'
  },
  ASTR: {
    transakNetwork: 'mainnet',
    chain: 'astar',
    key: 'ASTR|astar|mainnet',
    symbol: 'ASTR',
    support: 'SUBSTRATE'
  },
  GLMR: {
    transakNetwork: 'mainnet',
    chain: 'moonbeam',
    key: 'GLMR|moonbeam|mainnet',
    symbol: 'GLMR',
    support: 'ETHEREUM'
  },
  MOVR: {
    transakNetwork: 'moonriver',
    chain: 'moonriver',
    key: 'MOVR|moonriver|moonriver',
    symbol: 'MOVR',
    support: 'ETHEREUM'
  },
  ETH: {
    transakNetwork: 'ethereum',
    chain: 'ethereum',
    key: 'ETH|ethereum|ethereum',
    symbol: 'ETH',
    support: 'ETHEREUM'
  },
  BNB: {
    transakNetwork: 'bsc',
    chain: 'binance',
    key: 'BNB|binance|bsc',
    symbol: 'BNB',
    support: 'ETHEREUM'
  }
};
