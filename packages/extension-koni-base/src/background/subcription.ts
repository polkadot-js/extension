// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { take } from 'rxjs';

import { subscribeBalance } from '@polkadot/extension-koni-base/api/dotsama/balance';
import { subcribeCrowdloan } from '@polkadot/extension-koni-base/api/dotsama/crowdloan';
import { dotSamaAPIMap, state } from '@polkadot/extension-koni-base/background/handlers';
import { ALL_ACCOUNT_KEY } from '@polkadot/extension-koni-base/constants';
import { accounts as accountsObservable } from '@polkadot/ui-keyring/observable/accounts';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

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

    let unsubBalances: () => void | undefined;
    let unsubCrowdloans: () => void | undefined;

    state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo) {
        const { address } = currentAccountInfo;

        this.detectAddresses(address)
          .then((addresses) => {
            unsubBalances = this.initBalanceSubscription(addresses);
            unsubCrowdloans = this.initCrowdloanSubscription(addresses);
          })
          .catch(console.error);
      }

      state.subscribeCurrentAccount().subscribe({
        next: ({ address }) => {
          unsubBalances && unsubBalances();
          unsubCrowdloans && unsubCrowdloans();
          this.detectAddresses(address)
            .then((addresses) => {
              unsubBalances = this.initBalanceSubscription(addresses);
              unsubCrowdloans = this.initCrowdloanSubscription(addresses);
            })
            .catch(console.error);
        }
      });
    });
  }

  detectAddresses (currentAccountAddress: string) {
    return new Promise<Array<string>>((resolve, reject) => {
      if (currentAccountAddress === ALL_ACCOUNT_KEY) {
        accountsObservable.subject.pipe(take(1))
          .subscribe((accounts: SubjectInfo): void => {
            resolve([...Object.keys(accounts)]);
          });
      } else {
        return resolve([currentAccountAddress]);
      }
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

  initBalanceSubscription (addresses: string[]) {
    const subscriptionPromises = subscribeBalance(addresses, dotSamaAPIMap, (networkKey, rs) => {
      state.setBalanceItem(networkKey, rs);
    });

    return () => {
      subscriptionPromises.forEach((subProm) => {
        subProm.then((unsub) => {
          unsub && unsub();
        }).catch(console.error);
      });
    };
  }

  initCrowdloanSubscription (addresses: string[]) {
    const subscriptionPromise = subcribeCrowdloan(addresses, dotSamaAPIMap, (networkKey, rs) => {
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
