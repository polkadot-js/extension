// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { subscribeBalance } from '@polkadot/extension-koni-base/api/dotsama/balance';
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
    this.initChainRegistrySubscription();

    state.getCurrentAccount(({ address }) => {
      let unsubBalances = this.initBalanceSubscription(address);

      state.subscribeCurrentAccount().subscribe({
        next: ({ address }) => {
          unsubBalances();
          unsubBalances = this.initBalanceSubscription(address);
        }
      });

      let unsubCrowdloans = this.initCrowdloanSubscription(address);

      state.subscribeCurrentAccount().subscribe({
        next: ({ address }) => {
          unsubCrowdloans();
          unsubCrowdloans = this.initCrowdloanSubscription(address);
        }
      });
    });
  }

  initChainRegistrySubscription () {
    Object.entries(dotSamaAPIMap).map(async ([networkKey, apiProps]) => {
      const networkAPI = await apiProps.isReady;

      const { chainDecimals, chainTokens } = networkAPI.api.registry;

      state.setChainRegistryItem(networkKey, {
        chainDecimals,
        chainTokens
      });
    });
  }

  initBalanceSubscription (address: string) {
    const subscriptionPromises = subscribeBalance(address, dotSamaAPIMap, (networkKey, rs) => {
      state.setBalanceItem(networkKey, rs);
    });

    return () => {
      Promise.all(subscriptionPromises)
        .then((subscriptions) => {
          subscriptions.forEach((unsub) => {
            // @ts-ignore
            unsub && unsub();
          });
        }).catch(console.error);
    };
  }

  initCrowdloanSubscription (address: string) {
    const subscriptionPromise = subcribeCrowdloan(address, dotSamaAPIMap, (networkKey, rs) => {
      state.setCrowdloanItem(networkKey, rs);
    });

    return () => {
      subscriptionPromise.then((unsubMap) => {
        Object.values(unsubMap).forEach((unsub) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          unsub && unsub();
        });
      }).catch(console.error);
    };
  }
}
