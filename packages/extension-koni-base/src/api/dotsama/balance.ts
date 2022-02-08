// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, ApiProps, BalanceItem, BalanceRPCResponse } from '@polkadot/extension-base/background/KoniTypes';
import { BN } from '@polkadot/util';

export function subscribeBalance (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: BalanceItem) => void) {
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

    // @ts-ignore
    return networkAPI.api.query.system.account.multi(addresses, (balances: BalanceRPCResponse[]) => {
      let [free, reserved, miscFrozen, feeFrozen] = [new BN(0), new BN(0), new BN(0), new BN(0)];

      balances.forEach((balance: BalanceRPCResponse) => {
        free = free.add(balance.data?.free?.toBn() || new BN(0));
        reserved = reserved.add(balance.data?.reserved?.toBn() || new BN(0));
        miscFrozen = miscFrozen.add(balance.data?.miscFrozen?.toBn() || new BN(0));
        feeFrozen = feeFrozen.add(balance.data?.feeFrozen?.toBn() || new BN(0));
      });

      const balanceItem = {
        state: APIItemState.READY,
        free: free.toString(),
        reserved: reserved.toString(),
        miscFrozen: miscFrozen.toString(),
        feeFrozen: feeFrozen.toString()
      } as BalanceItem;

      callback(networkKey, balanceItem);
    });
  });
}
