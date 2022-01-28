// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceItem, BalanceRPCResponse } from '@polkadot/extension-base/background/KoniTypes';
import { dotSamaAPIMap, state } from '@polkadot/extension-koni-base/background/handlers';

export class KoniSubcription {
  private subscriptionMap: Record<string, any> = {};

  getSubscriptionMap () {
    return this.subscriptionMap;
  }

  getSubscription (name: string): any {
    return this.subscriptionMap[name];
  }

  init () {
    state.getCurrentAccount(({ address }) => {
      const balanceSubs = this.initBalanceSubscription(address);

      state.subscribeCurrentAccount().subscribe({
        next: ({ address }) => {
          balanceSubs.map(async (promise) => {
            promise.then((unsub) => {
              // @ts-ignore
              unsub();
            }).catch((err) => {
              console.error(err);
            });
          });

          this.initBalanceSubscription(address);
        }
      });
    });
  }

  initBalanceSubscription (address: string) {
    return Object.entries(dotSamaAPIMap).map(async ([networkKey, apiProps]) => {
      const networkAPI = await apiProps.isReady;

      return networkAPI.api.query.system.account(address, ({ data }: BalanceRPCResponse) => {
        const balanceItem = {
          ready: true,
          free: data.free?.toString() || '0',
          reserved: data.reserved?.toString() || '0',
          miscFrozen: data.feeFrozen?.toString() || '0',
          feeFrozen: data.miscFrozen?.toString() || '0'
        } as BalanceItem;

        state.setBalanceItem(networkKey, balanceItem);
      });
    });
  }
}
