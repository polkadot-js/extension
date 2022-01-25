// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';
import BigN from 'bignumber.js';

import { isEmptyArray } from './support';
import { AccountInfoItem, BalanceInfo, BalanceSubInfo } from './types';

export const priceParamByNetworkNameMap: Record<string, string> = {
  acala: 'acala-token',
  // 'altair': 'altair',
  // 'astar': 'astar',
  // 'basilisk': 'basilisk',
  bifrost: 'bifrost-native-coin',
  calamari: 'calamari-network',
  clover: 'clover',
  genshiro: 'genshiro',
  // 'heiko': 'heiko',
  hydradx: 'hydradx',
  karura: 'karura',
  // 'khala': 'khala',
  kilt: 'kilt-protocol',
  kintsugi: 'kintsugi',
  kusama: 'kusama',
  // 'moonbeam': 'moonbeam',
  moonriver: 'moonriver',
  parallel: 'par-stablecoin',
  // 'picasso': 'picasso',
  // 'pioneer': 'pioneer',
  polkadot: 'polkadot',
  // 'quartz': 'quartz',
  sakura: 'sakura',
  // 'shadow': 'shadow',
  shiden: 'shiden'
  // 'statemine': 'statemine',
  // 'statemint': 'statemint',
  // 'subsocial': 'subsocial',
  // 'zeitgeist': 'zeitgeist',
};

export const BN_TEN = new BigN(10);
export const BN_ZERO = new BigN(0);

export const getAcalaCrowdloanContribute = async (polkadotAddress: string) => {
  const acalaContributionApi = 'https://crowdloan.aca-api.network/contribution';

  try {
    const res = await axios.get(`${acalaContributionApi}/${polkadotAddress}`);

    if (res.status !== 200) {
      console.warn('Failed to get Acala crowdloan contribute');
    }

    return res.data;
  } catch (err) {
    console.error('Failed to get Acala crowdloan contribute', err);

    return undefined;
  }
};

type BalanceType = {
  balance: string
  priceField: string
  comparableValue: string
  tokenPrices: any[]
  decimals: number
  symbol: string
  balanceClassName?: string
}

type BalanceWithDecimalsProps = {
  balance: string
  decimals: number
}

const getBalanceWithDecimals = ({ balance, decimals }: BalanceWithDecimalsProps) => {
  return new BigN(balance).div(BN_TEN.pow(decimals));
};

const getConvertedBalance = (balance: BigN, price: string) => (
  balance && price
    ? balance.multipliedBy(new BigN(price))
    : BN_ZERO
);

export type BalanceValueType = {
  balanceValue: BigN;
  convertedBalanceValue: BigN;
  symbol: string
}

export const getBalances = ({ balance,
  comparableValue,
  decimals,
  priceField,
  symbol,
  tokenPrices }: BalanceType): BalanceValueType => {
  const stable = symbol.toLowerCase().includes('usd') ? 1 : 0;

  const balanceValue = getBalanceWithDecimals({ balance, decimals });

  const priceValue = (tokenPrices.find((x) => x[priceField] === comparableValue.toLowerCase())?.current_price)?.toString() || stable;

  const convertedBalanceValue = getConvertedBalance(balanceValue, priceValue);

  return {
    balanceValue,
    convertedBalanceValue,
    symbol
  };
};

export const parseBalancesInfo = (tokenPrices: any[], balanceInfo: AccountInfoItem): BalanceInfo => {
  const { info, tokenDecimals, tokenSymbol } = balanceInfo;

  const decimals = tokenDecimals && !isEmptyArray(tokenDecimals) ? tokenDecimals[0] : 0;
  const symbol = tokenSymbol && !isEmptyArray(tokenSymbol) ? tokenSymbol[0] : '';

  // todo: handle case that decimals is 0
  // if (!decimals) {
  //   return null;
  // }

  const { freeBalance, frozenFee, frozenMisc, reservedBalance } = info[symbol];
  const transferableBalance = new BigN(freeBalance).minus(new BigN(frozenMisc)).toString();

  const accountData = [
    { key: 'free', label: 'Transferable', value: transferableBalance },
    { key: 'reserved', label: 'Reserved balance', value: reservedBalance },
    { key: 'locked', label: 'Locked balance', value: frozenMisc },
    { key: 'frozen', label: 'Frozen fee', value: frozenFee }
  ];

  const detailBalances: BalanceSubInfo[] = [];

  let totalBalanceValue = BN_ZERO;
  let totalConvertedBalanceValue = BN_ZERO;

  accountData.forEach(({ key, label, value }) => {
    const { balanceValue, convertedBalanceValue } = getBalances({
      balance: value,
      decimals,
      symbol,
      tokenPrices,
      priceField: 'symbol',
      comparableValue: symbol
    });

    if (['free', 'reserved', 'locked'].includes(key)) {
      totalBalanceValue = totalBalanceValue.plus(balanceValue);
      totalConvertedBalanceValue = totalConvertedBalanceValue.plus(convertedBalanceValue);
    }

    detailBalances.push({
      key,
      label,
      symbol,
      convertedBalanceValue,
      balanceValue
    });
  });

  // todo: need to find a way to get childrenBalance from APIs, like sub.id
  const childrenBalances: BalanceSubInfo[] = [];

  return {
    symbol,
    balanceValue: totalBalanceValue,
    convertedBalanceValue: totalConvertedBalanceValue,
    detailBalances,
    childrenBalances
  };
};
