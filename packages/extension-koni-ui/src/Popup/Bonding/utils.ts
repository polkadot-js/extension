// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';

const formatLocaleNumber = (number: number): string => {
  return number.toLocaleString('en-UK', { maximumFractionDigits: 4 });
};

export function parseBalanceString (balance: number, unit: string) {
  const milThreshold = 1000000;

  if (balance > milThreshold) {
    return formatLocaleNumber(Math.round((balance / milThreshold) * 100) / 100) + ' ' + `M${unit}`;
  } else {
    return formatLocaleNumber(Math.round(balance * 100) / 100) + ' ' + unit;
  }
}

export function getChainType (networkKey: string | null) {
  if (networkKey === null) {
    return -1;
  }

  if (['moonbeam', 'moonriver', 'moonbase'].includes(networkKey)) {
    return 1;
  }

  return 0;
}

export function getStakeUnit (networkKey: string, networkJson: NetworkJson) {
  if (['darwinia', 'crab', 'pangolin'].includes(networkKey)) {
    return 'POWER';
  }

  return networkJson.nativeToken as string;
}

export const BOND_DURATION_OPTIONS: Record<string, any[]> = {
  darwinia: [
    { text: 'No fixed period', value: '0' },
    { text: '1 month', value: '1' },
    { text: '2 months', value: '2' },
    { text: '3 months', value: '3' },
    { text: '4 months', value: '4' },
    { text: '5 months', value: '5' },
    { text: '6 months', value: '6' },
    { text: '7 months', value: '7' },
    { text: '8 months', value: '8' },
    { text: '9 months', value: '9' },
    { text: '10 months', value: '10' },
    { text: '11 months', value: '11' },
    { text: '12 months', value: '12' },
    { text: '13 months', value: '13' },
    { text: '14 months', value: '14' },
    { text: '15 months', value: '15' },
    { text: '16 months', value: '16' },
    { text: '17 months', value: '17' },
    { text: '18 months', value: '18' },
    { text: '19 months', value: '19' },
    { text: '20 months', value: '20' },
    { text: '21 months', value: '21' },
    { text: '22 months', value: '22' },
    { text: '23 months', value: '23' },
    { text: '24 months', value: '24' },
    { text: '25 months', value: '25' },
    { text: '26 months', value: '26' },
    { text: '27 months', value: '27' },
    { text: '28 months', value: '28' },
    { text: '29 months', value: '29' },
    { text: '30 months', value: '30' },
    { text: '31 months', value: '31' },
    { text: '32 months', value: '32' },
    { text: '33 months', value: '33' },
    { text: '34 months', value: '34' },
    { text: '35 months', value: '35' },
    { text: '36 months', value: '36' }
  ],
  pangolin: [
    { text: 'No fixed period', value: '0' },
    { text: '1 month', value: '1' },
    { text: '2 months', value: '2' },
    { text: '3 months', value: '3' },
    { text: '4 months', value: '4' },
    { text: '5 months', value: '5' },
    { text: '6 months', value: '6' },
    { text: '7 months', value: '7' },
    { text: '8 months', value: '8' },
    { text: '9 months', value: '9' },
    { text: '10 months', value: '10' },
    { text: '11 months', value: '11' },
    { text: '12 months', value: '12' },
    { text: '13 months', value: '13' },
    { text: '14 months', value: '14' },
    { text: '15 months', value: '15' },
    { text: '16 months', value: '16' },
    { text: '17 months', value: '17' },
    { text: '18 months', value: '18' },
    { text: '19 months', value: '19' },
    { text: '20 months', value: '20' },
    { text: '21 months', value: '21' },
    { text: '22 months', value: '22' },
    { text: '23 months', value: '23' },
    { text: '24 months', value: '24' },
    { text: '25 months', value: '25' },
    { text: '26 months', value: '26' },
    { text: '27 months', value: '27' },
    { text: '28 months', value: '28' },
    { text: '29 months', value: '29' },
    { text: '30 months', value: '30' },
    { text: '31 months', value: '31' },
    { text: '32 months', value: '32' },
    { text: '33 months', value: '33' },
    { text: '34 months', value: '34' },
    { text: '35 months', value: '35' },
    { text: '36 months', value: '36' }
  ],
  default: [
    { text: 'No fixed period', value: '0' },
    { text: '1 month', value: '1' },
    { text: '3 months', value: '3' },
    { text: '6 months', value: '6' },
    { text: '12 months', value: '12' }
  ]
};
