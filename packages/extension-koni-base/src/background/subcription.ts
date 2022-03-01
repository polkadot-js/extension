// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { take } from 'rxjs';

import { subscribeBalance } from '@polkadot/extension-koni-base/api/dotsama/balance';
import { subcribeCrowdloan } from '@polkadot/extension-koni-base/api/dotsama/crowdloan';
import { subscribeStaking } from '@polkadot/extension-koni-base/api/dotsama/staking';
import { dotSamaAPIMap, nftHandler, state } from '@polkadot/extension-koni-base/background/handlers';
import { ALL_ACCOUNT_KEY } from '@polkadot/extension-koni-base/constants';
import { accounts as accountsObservable } from '@polkadot/ui-keyring/observable/accounts';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

export class KoniSubcription {
  private subscriptionMap: Record<string, any> = {};
  // @ts-ignore
  unsubBalances: () => void | undefined;
  // @ts-ignore
  unsubCrowdloans: () => void | undefined;

  // @ts-ignore
  unsubStaking: () => void | undefined;

  getSubscriptionMap () {
    return this.subscriptionMap;
  }

  getSubscription (name: string): any {
    return this.subscriptionMap[name];
  }

  init () {
    this.initChainRegistrySubscription();

    state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo) {
        const { address } = currentAccountInfo;

        this.subscribleBalancesAndCrowdloans(address);
        this.subscribeStaking(address);
      }

      state.subscribeCurrentAccount().subscribe({
        next: ({ address }) => {
          this.subscribleBalancesAndCrowdloans(address);
          this.subscribeStaking(address);
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

  subscribleBalancesAndCrowdloans (address: string) {
    this.unsubBalances && this.unsubBalances();
    this.unsubCrowdloans && this.unsubCrowdloans();
    this.detectAddresses(address)
      .then((addresses) => {
        this.unsubBalances = this.initBalanceSubscription(addresses);
        this.unsubCrowdloans = this.initCrowdloanSubscription(addresses);
      })
      .catch(console.error);
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

  subscribeNft (address: string) {
    this.detectAddresses(address)
      .then((addresses) => {
        this.initNftSubscription(addresses);
      })
      .catch(console.error);
  }

  initNftSubscription (addresses: string[]) {
    nftHandler.setAddresses(addresses);
    nftHandler.handleNfts()
      .then((r) => {
        state.setNft(nftHandler.getNftJson());
        console.log('set nft state done for address', addresses);
      })
      .catch(console.log);
  }

  subscribeStaking (address: string) {
    this.unsubStaking && this.unsubStaking();
    this.detectAddresses(address)
      .then((addresses) => {
        this.unsubStaking = this.initStakingSubscription(addresses);
      })
      .catch(console.error);
  }

  initStakingSubscription (addresses: string[]) {
    const subscriptionPromises = subscribeStaking(addresses, dotSamaAPIMap, (networkKey, rs) => {
      state.setStakingItem(networkKey, rs);
      console.log('set new staking item', rs);
    });

    return () => {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      subscriptionPromises.forEach((subProm) => {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        subProm.then((unsub) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          unsub && unsub();
        }).catch(console.error);
      });
    };
  }
}
