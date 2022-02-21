// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { APIItemState, ApiProps, BalanceItem, BalanceRPCResponse } from '@polkadot/extension-base/background/KoniTypes';
import { sumBN } from '@polkadot/extension-koni-base/utils/utils';
import { BN } from '@polkadot/util';

export function subscribeBalance (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: BalanceItem) => void) {
  return Object.entries(dotSamaAPIMap).map(async ([networkKey, apiProps]) => {
    const networkAPI = await apiProps.isReady;

    if (networkKey === 'kintsugi') {
      const freeMap: Record<string, BN> = {};
      const reservedMap: Record<string, BN> = {};
      const miscFrozenMap: Record<string, BN> = {};
      const feeFrozenMap: Record<string, BN> = {};

      const unsubProms = addresses.map((address) => {
        console.log(address);

        return networkAPI.api.derive.balances?.all(address, (balance: DeriveBalancesAll) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          freeMap[address] = balance.freeBalance?.toBn() || new BN(0);
          reservedMap[address] = balance.reservedBalance?.toBn() || new BN(0);
          miscFrozenMap[address] = balance.frozenMisc?.toBn() || new BN(0);
          feeFrozenMap[address] = balance.frozenFee?.toBn() || new BN(0);

          const balanceItem = {
            state: APIItemState.READY,
            free: sumBN(Object.values(freeMap)).toString(),
            reserved: sumBN(Object.values(reservedMap)).toString(),
            miscFrozen: sumBN(Object.values(miscFrozenMap)).toString(),
            feeFrozen: sumBN(Object.values(feeFrozenMap)).toString()
          } as BalanceItem;

          callback(networkKey, balanceItem);
        });
      });

      return async () => {
        const unsubs = await Promise.all(unsubProms);

        unsubs.forEach((unsub) => {
          unsub && unsub();
        });
      };
    } else {
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
    }
  });
}
