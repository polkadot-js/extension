// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';

// 1000.12345 -> 1,000; 1000,654321 -> 1,001
export const formatLocaleNumber = (number: number, digits?: number): string => {
  return number.toLocaleString('en-UK', { maximumFractionDigits: digits || 0 });
};

const prefixArray = ['a', 'n', 'µ', 'm', '', 'K', 'M', 'B', 'T'];

export const convertToSimpleNumber = (value: number, decimals: number): string => {
  if (!value) {
    return '0 ';
  }

  let prefixIndex = prefixArray.indexOf('');
  const a = new BigN(10).pow(decimals);
  let val = new BigN(value).dividedBy(a);
  let diff = Math.log10(val.toNumber());

  // > 10,000 || < 0,01
  while (diff >= 5 || diff < -2) {
    if (diff > 0) {
      val = val.dividedBy(1000);
      prefixIndex++;
    } else {
      val = val.multipliedBy(1000);
      prefixIndex--;
    }

    diff = Math.log10(val.toNumber());
  }

  return `${val.toFormat()} ${prefixArray[prefixIndex]}`;
};
