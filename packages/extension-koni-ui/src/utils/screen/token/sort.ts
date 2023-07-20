// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types';

export const sortTokenByValue = (a: TokenBalanceItemType, b: TokenBalanceItemType): number => {
  return b.total.convertedValue.minus(a.total.convertedValue).toNumber();
};
