// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, BalanceItem, BalanceRPCResponse } from '@polkadot/extension-base/background/KoniTypes';
import { subcribeCrowdloan } from '@polkadot/extension-koni-base/api/dotsama/crowdloan';
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
      let unsubCrowdloans = this.initCrowdloanSubscription(address);

      state.subscribeCurrentAccount().subscribe({
        next: async ({ address }) => {
          await unsubCrowdloans();
          unsubCrowdloans = this.initCrowdloanSubscription(address);
        }
      });

      let unsubBalances = this.initBalanceSubscription(address);

      state.subscribeCurrentAccount().subscribe({
        next: async ({ address }) => {
          await unsubBalances();
          unsubBalances = this.initBalanceSubscription(address);
        }
      });
    });
  }

  initBalanceSubscription (address: string) {
    const promiseList = Object.entries(dotSamaAPIMap).map(async ([networkKey, apiProps]) => {
      const networkAPI = await apiProps.isReady;

      return networkAPI.api.query.system.account(address, ({ data }: BalanceRPCResponse) => {
        const balanceItem = {
          state: APIItemState.READY,
          free: data.free?.toString() || '0',
          reserved: data.reserved?.toString() || '0',
          miscFrozen: data.feeFrozen?.toString() || '0',
          feeFrozen: data.miscFrozen?.toString() || '0'
        } as BalanceItem;

        state.setBalanceItem(networkKey, balanceItem);
      });
    });

    return async () => {
      const unsubList = await Promise.all(promiseList);

      unsubList.forEach((unsub) => {
        // @ts-ignore
        unsub();
      });
    };
  }

  initCrowdloanSubscription (address: string) {
    const subscriptionPromise = subcribeCrowdloan(address, dotSamaAPIMap, (networkKey, rs) => {
      state.setCrowdloanItem(networkKey, rs);
    });

    return async () => {
      const unsubMap = await subscriptionPromise;

      Object.values(unsubMap).forEach((unsub) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        unsub();
      });
    };
  }
}
