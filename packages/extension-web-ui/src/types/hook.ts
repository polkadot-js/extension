// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PriceChangeStatus, TokenBalanceItemType } from '@subwallet/extension-web-ui/types/balance';
import BigN from 'bignumber.js';

export type TokenGroupHookType = {
  tokenGroupMap: Record<string, string[]>,
  sortedTokenGroups: string[],
  sortedTokenSlugs: string[],
}

export type AccountBalanceHookType = {
  tokenBalanceMap: Record<string, TokenBalanceItemType>
  tokenGroupBalanceMap: Record<string, TokenBalanceItemType>,
  totalBalanceInfo: {
    convertedValue: BigN,
    converted24hValue: BigN,
    freeValue: BigN,
    lockedValue: BigN,
    change: {
      value: BigN,
      status?: PriceChangeStatus,
      percent: BigN
    }
  },
}
