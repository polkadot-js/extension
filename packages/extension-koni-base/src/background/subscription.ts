// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { take } from 'rxjs';

import { AuthUrls } from '@polkadot/extension-base/background/handlers/State';
import { ApiProps, NftTransferExtra } from '@polkadot/extension-base/background/KoniTypes';
import { subscribeBalance } from '@polkadot/extension-koni-base/api/dotsama/balance';
import { subscribeCrowdloan } from '@polkadot/extension-koni-base/api/dotsama/crowdloan';
import { getAllSubsquidStaking } from '@polkadot/extension-koni-base/api/staking/subsquidStaking';
import { nftHandler, state } from '@polkadot/extension-koni-base/background/handlers';
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
    state.getAuthorize((value) => {
      const authString = localStorage.getItem('authUrls') || '{}';
      const previousAuth = JSON.parse(authString) as AuthUrls;

      if (previousAuth && Object.keys(previousAuth).length) {
        Object.keys(previousAuth).forEach((url) => {
          if (previousAuth[url].isAllowed) {
            previousAuth[url].isAllowedMap = state.getAddressList(true);
          } else {
            previousAuth[url].isAllowedMap = state.getAddressList();
          }
        });
      }

      const migrateValue = { ...previousAuth, ...value };

      state.setAuthorize(migrateValue);
      localStorage.setItem('authUrls', '{}');
    });

    state.fetchCrowdloanFundMap().then(console.log).catch(console.error);

    state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo) {
        const { address } = currentAccountInfo;

        this.subscribeBalancesAndCrowdloans(address, state.getApiMap().dotSama);
      }

      state.subscribeServiceInfo().subscribe({
        // TODO: consider canceling all subscription and cron job when there's no network connected
        next: (serviceInfo) => {
          const { address } = serviceInfo.currentAccountInfo;

          state.initChainRegistry();
          this.subscribeBalancesAndCrowdloans(address, serviceInfo.apiMap.dotSama);
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

  subscribeBalancesAndCrowdloans (address: string, dotSamaApiMap: Record<string, ApiProps>) {
    this.unsubBalances && this.unsubBalances();
    this.unsubCrowdloans && this.unsubCrowdloans();
    state.resetBalanceMap();
    state.resetCrowdloanMap();
    this.detectAddresses(address)
      .then((addresses) => {
        this.unsubBalances = this.initBalanceSubscription(addresses, dotSamaApiMap);
        this.unsubCrowdloans = this.initCrowdloanSubscription(addresses, dotSamaApiMap);
      })
      .catch(console.error);
  }

  initBalanceSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>) {
    const subscriptionPromises = subscribeBalance(addresses, dotSamaApiMap, (networkKey, rs) => {
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

  initCrowdloanSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>) {
    const subscriptionPromise = subscribeCrowdloan(addresses, dotSamaApiMap, (networkKey, rs) => {
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

  subscribeNft (address: string, dotSamaApiMap: Record<string, ApiProps>) {
    this.detectAddresses(address)
      .then((addresses) => {
        this.initNftSubscription(addresses, dotSamaApiMap);
      })
      .catch(console.error);
  }

  initNftSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>) {
    const { cronUpdate, forceUpdate, selectedNftCollection } = state.getNftTransfer();

    if (forceUpdate && !cronUpdate) {
      console.log('skipping set nft state due to transfer');
      state.setNftTransfer({
        cronUpdate: true,
        forceUpdate: true,
        selectedNftCollection
      } as NftTransferExtra);
    } else { // after skipping 1 time of cron update
      state.setNftTransfer({
        cronUpdate: false,
        forceUpdate: false,
        selectedNftCollection
      } as NftTransferExtra);
      nftHandler.setApiProps(dotSamaApiMap);
      nftHandler.setAddresses(addresses);
      nftHandler.handleNfts(
        (data) => {
          state.updateNft(data);
        },
        (data) => {
          if (data !== null) {
            state.updateNftCollection(data);
          }
        },
        (ready) => {
          state.updateNftReady(ready);
        })
        .then(() => {
          console.log('nft state updated');
        })
        .catch(console.log);
    }
  }

  async subscribeStakingReward (address: string) {
    const addresses = await this.detectAddresses(address);

    await getAllSubsquidStaking(addresses, (networkKey, rs) => {
      state.setStakingItem(networkKey, rs);
    })
      .then((result) => {
        state.setStakingReward(result);
        console.log('set staking reward state done', result);
      })
      .catch(console.error);
  }
}
