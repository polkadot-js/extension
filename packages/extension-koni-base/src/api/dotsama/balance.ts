// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, ApiProps, BalanceItem, BalanceRPCResponse } from '@polkadot/extension-base/background/KoniTypes';

export function subscribeBalance (address: string, dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: BalanceItem) => void) {
  return Object.entries(dotSamaAPIMap).map(async ([networkKey, apiProps]) => {
    const networkAPI = await apiProps.isReady;

    if (!apiProps.api.tx || !apiProps.api.tx.balances) {
      callback(networkKey, {
        state: APIItemState.NOT_SUPPORT,
        free: '0',
        reserved: '0',
        miscFrozen: '0',
        feeFrozen: '0'
      } as BalanceItem);

      return null;
    }

    return networkAPI.api.query.system.account(address, ({ data }: BalanceRPCResponse) => {
      const balanceItem = {
        state: APIItemState.READY,
        free: data?.free?.toString() || '0',
        reserved: data?.reserved?.toString() || '0',
        miscFrozen: data?.feeFrozen?.toString() || '0',
        feeFrozen: data?.miscFrozen?.toString() || '0'
      } as BalanceItem;

      callback(networkKey, balanceItem);
    });
  });
}
