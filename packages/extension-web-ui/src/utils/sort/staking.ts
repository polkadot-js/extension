// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BN_TEN } from '@subwallet/extension-web-ui/constants';
import { StakingDataType } from '@subwallet/extension-web-ui/types';
import BigN from 'bignumber.js';

interface ItemData extends StakingDataType {
  price: number;
}

export const sortStakingByValue = (a: ItemData, b: ItemData): number => {
  const aValue = new BigN(a.staking.balance || '0').div(BN_TEN.pow(a.decimals));
  const bValue = new BigN(b.staking.balance || '0').div(BN_TEN.pow(b.decimals));
  const aConvertValue = aValue.multipliedBy(a.price).toNumber();
  const bConvertValue = bValue.multipliedBy(b.price).toNumber();
  const convertValue = bConvertValue - aConvertValue;

  if (convertValue) {
    return convertValue;
  } else {
    return bValue.minus(aValue).toNumber();
  }
};
