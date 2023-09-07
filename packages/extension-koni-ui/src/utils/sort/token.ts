// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types';

export const sortTokenByValue = (a: TokenBalanceItemType, b: TokenBalanceItemType): number => {
  const convertValue = b.total.convertedValue.minus(a.total.convertedValue).toNumber();

  if (convertValue) {
    return convertValue;
  } else {
    return b.total.value.minus(a.total.value).toNumber();
  }
};
