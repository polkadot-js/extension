// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { take } from 'rxjs';

import { subscribeBalance } from '@polkadot/extension-koni-base/api/dotsama/balance';
import { subscribeCrowdloan } from '@polkadot/extension-koni-base/api/dotsama/crowdloan';
import { getSubqueryStakingReward, subscribeStaking } from '@polkadot/extension-koni-base/api/dotsama/staking';
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
    state.fetchCrowdloanFundMap().then(console.log).catch(console.error);
    this.initChainRegistrySubscription();

    state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo) {
        const { address } = currentAccountInfo;

        this.subscribeBalancesAndCrowdloans(address);
        this.subscribeStaking(address);
      }

      state.subscribeCurrentAccount().subscribe({
        next: ({ address }) => {
          this.subscribeBalancesAndCrowdloans(address);
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

  subscribeBalancesAndCrowdloans (address: string) {
    this.unsubBalances && this.unsubBalances();
    this.unsubCrowdloans && this.unsubCrowdloans();
    state.resetBalanceMap();
    state.resetCrowdloanMap();
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
    const subscriptionPromise = subscribeCrowdloan(addresses, dotSamaAPIMap, (networkKey, rs) => {
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
    state.resetStakingMap();
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
      subscriptionPromises
        .then((unsub) => {
          unsub && unsub();
        })
        .catch(console.error);
    };
  }

  async subscribeStakingReward (address: string) {
    const addresses = await this.detectAddresses(address);

    await getSubqueryStakingReward(addresses)
      .then((result) => {
        state.setStakingReward(result);
        console.log('set staking reward state', result.details);
      })
      .catch(console.error);
  }
}
