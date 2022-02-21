// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';
import BigN from 'bignumber.js';

import { isEmptyArray } from './common';
import { AccountInfoItem, BalanceInfo, BalanceSubInfo } from './types';

export const priceParamByNetworkKeyMap: Record<string, string> = {
  acala: 'acala',
  // 'altair':'altair',
  astar: 'astar',
  // 'basilisk': 'basilisk',
  bifrost: 'bifrost-native-coin',
  calamari: 'calamari-network',
  centrifuge: 'centrifuge',
  clover: 'clover',
  coinversation: 'coinversation',
  // 'composableFinance': 'composableFinance',
  crab: 'darwinia-crab-network',
  crust: 'crust-network',
  darwinia: 'darwinia-network-native-token',
  edgeware: 'edgeware',
  efinity: 'efinity',
  equilibrium: 'equilibrium',
  genshiro: 'genshiro',
  heiko: 'heiko',
  hydradx: 'hydradx',
  integritee: 'integritee',
  interlay: 'interlay',
  karura: 'karura',
  khala: 'khala',
  kilt: 'kilt-protocol',
  kintsugi: 'kintsugi',
  // 'koni':'koni',
  kusama: 'kusama',
  litentry: 'litentry',
  // 'manta': 'manta',
  moonbeam: 'moonbeam',
  moonriver: 'moonriver',
  nodle: 'nodle',
  parallel: 'paralink-network',
  phala: 'pha',
  picasso: 'pica',
  // 'pichiu': 'pichiu',
  // 'pioneer': 'pioneer',
  polkadot: 'polkadot',
  // 'quartz': 'quartz',
  robonomics: 'robonomics-network',
  // 'rococo':'rococo',
  sakura: 'sakura',
  shadow: 'crust-storage-market',
  shiden: 'shiden',
  'sora-substrate': 'sora',
  statemine: 'statemine',
  statemint: 'statemint',
  subgame: 'subgame'
  // 'subsocial':'subsocial',
  // 'westend':'westend',
  // 'zeitgeist': 'zeitgeist',
};

export const BN_TEN = new BigN(10);
export const BN_ZERO = new BigN(0);

export const getAcalaCrowdloanContribute = async (polkadotAddress: string) => {
  const acalaContributionApi = 'https://api.polkawallet.io/acala-distribution-v2/crowdloan?account=';

  try {
    const res = await axios.get(`${acalaContributionApi}/${polkadotAddress}`);

    if (res.status !== 200) {
      console.warn('Failed to get Acala crowdloan contribute');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return res.data;
  } catch (err) {
    console.error('Failed to get Acala crowdloan contribute', err);

    return undefined;
  }
};

type BalanceType = {
  balance: string
  price?: number
  decimals: number
  symbol: string
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
  decimals,
  price,
  symbol }: BalanceType): BalanceValueType => {
  const stable = symbol.toLowerCase().includes('usd') ? 1 : 0;

  const balanceValue = getBalanceWithDecimals({ balance, decimals });

  const priceValue = price || stable;

  const convertedBalanceValue = getConvertedBalance(balanceValue, `${priceValue}`);

  return {
    balanceValue,
    convertedBalanceValue,
    symbol
  };
};

export const parseBalancesInfo = (priceMap: Record<string, number>, balanceInfo: AccountInfoItem): BalanceInfo => {
  const { info, networkKey, tokenDecimals, tokenSymbol } = balanceInfo;

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
      price: priceMap[networkKey]
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
