// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { isEmptyArray } from '@subwallet/extension-koni-ui/util/common';
import axios from 'axios';
import BigN from 'bignumber.js';

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

function getTokenPrice (tokenPriceMap: Record<string, number>, token: string): number {
  if (token === 'LCDOT') {
    return (tokenPriceMap.dot || 0) * 0.6925;
  }

  return tokenPriceMap[token.toLowerCase()] || 0;
}

export const parseBalancesInfo = (priceMap: Record<string, number>, tokenPriceMap: Record<string, number>, balanceInfo: AccountInfoItem, tokenMap: Record<string, TokenInfo>, networkJson: NetworkJson): BalanceInfo => {
  const { balanceItem, networkKey, tokenDecimals, tokenSymbols } = balanceInfo;

  const decimals = tokenDecimals && !isEmptyArray(tokenDecimals) ? tokenDecimals[0] : 0;
  const symbol = tokenSymbols && !isEmptyArray(tokenSymbols) ? tokenSymbols[0] : '';

  const { children: balanceChildren, feeFrozen: frozenFee, free: freeBalance, miscFrozen: frozenMisc, reserved: reservedBalance } = balanceItem;
  const transferableBalance = new BigN(freeBalance || 0).minus(new BigN(frozenMisc || 0)).toString();

  const accountData = [
    { key: 'free', label: 'Transferable', value: transferableBalance },
    { key: 'reserved', label: 'Reserved balance', value: reservedBalance },
    { key: 'locked', label: 'Locked balance', value: frozenMisc },
    { key: 'frozen', label: 'Frozen fee', value: frozenFee }
  ];

  const detailBalances: BalanceSubInfo[] = [];

  let totalBalanceValue = BN_ZERO;
  let totalConvertedBalanceValue = BN_ZERO;

  accountData.forEach(({ key, label, value = '0' }) => {
    const { balanceValue, convertedBalanceValue } = getBalances({
      balance: value,
      decimals,
      symbol,
      price: priceMap[networkJson.coinGeckoKey || networkKey]
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

  const childrenBalances: BalanceSubInfo[] = [];

  if (balanceChildren) {
    Object.keys(balanceChildren).forEach((token) => {
      const item = balanceChildren[token];
      const _token: string = tokenMap[token]?.symbolAlt || token;

      const { balanceValue, convertedBalanceValue } = getBalances({
        balance: item.free,
        decimals: item.decimals,
        symbol: _token,
        price: getTokenPrice(tokenPriceMap, token)
      });

      childrenBalances.push({
        key: _token,
        label: '',
        symbol: _token,
        convertedBalanceValue,
        balanceValue
      });
    });
  }

  return {
    symbol,
    balanceValue: totalBalanceValue,
    convertedBalanceValue: totalConvertedBalanceValue,
    detailBalances,
    childrenBalances
  };
};
