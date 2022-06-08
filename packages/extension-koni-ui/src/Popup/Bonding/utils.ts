// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

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

