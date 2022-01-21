// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';

export type AccountInfoByChain = {
  freeBalance: string
  frozenFee: string
  reservedBalance: string
  frozenMisc: string
}

export type AccountInfoItem = {
  network: string;
  tokenDecimals: number[];
  tokenSymbol: string[];
  info: Record<string, AccountInfoByChain>;
}

export type Info = {
  ss58Format: number
  tokenDecimals?: number[]
  tokenSymbol: string[]
  icon: string
  name: string
}

export type ChainInfo = {
  [key: string]: Info
}

export type BalanceSubInfo = {
  key: string;
  label: string;
  symbol: string;
  balanceValue: BigN;
  convertedBalanceValue: BigN;
}

export type AccountInfoByNetwork = {
  key: string;
  networkName: string;
  networkDisplayName: string;
  networkPrefix: number;
  networkLogo: string;
  networkIconTheme: string;
  address: string;
}

export type BalanceInfo = {
  symbol: string;
  balanceValue: BigN;
  convertedBalanceValue: BigN;
  detailBalances: BalanceSubInfo[];
  childrenBalances: BalanceSubInfo[];
}
