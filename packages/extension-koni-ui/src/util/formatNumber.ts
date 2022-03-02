// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// 1000.12345 -> 1,000; 1000,654321 -> 1,001
export const formatLocaleNumber = (number: number): string => {
  return number.toLocaleString('en-UK', { maximumFractionDigits: 0 });
};
