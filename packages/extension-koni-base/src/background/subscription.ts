// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { ApiProps, CustomEvmToken, NftTransferExtra, StakingRewardJson } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { subscribeCrowdloan } from '@subwallet/extension-koni-base/api/dotsama/crowdloan';
import { stakingOnChainApi } from '@subwallet/extension-koni-base/api/staking';
import { getAllSubsquidStaking } from '@subwallet/extension-koni-base/api/staking/subsquidStaking';
import { nftHandler, state } from '@subwallet/extension-koni-base/background/handlers';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-koni-base/constants';
import { Subscription, take } from 'rxjs';
import Web3 from 'web3';

import { accounts as accountsObservable } from '@polkadot/ui-keyring/observable/accounts';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

export class KoniSubscription {
  public status: 'pending' | 'running' | 'stoped' = 'pending';
  private serviceSubscription: Subscription | undefined;
  private subscriptionMap: Record<string, any> = {};
  // @ts-ignore
  unsubBalances: (() => void) | undefined;
  // @ts-ignore
  unsubCrowdloans: (() => void) | undefined;
  // @ts-ignore
  unsubStakingOnChain: (() => void) | undefined;

  constructor () {
    this.init();
  }

  getSubscriptionMap () {
    return this.subscriptionMap;
  }

  getSubscription (name: string): any {
    return this.subscriptionMap[name];
  }

  async stopAllSubscription () {
    const promises = [];

    this.unsubBalances && promises.push(this.unsubBalances());
    this.unsubCrowdloans && promises.push(this.unsubCrowdloans());
    this.unsubStakingOnChain && promises.push(this.unsubStakingOnChain());

    await Promise.all(promises);
    this.unsubBalances = undefined;
    this.unsubCrowdloans = undefined;
    this.unsubStakingOnChain = undefined;
  }

  start () {
    if (this.status === 'running') {
      return;
    }

    console.log('Stating subscrition');
    state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo) {
        const { address } = currentAccountInfo;

        this.subscribeBalancesAndCrowdloans(address, state.getDotSamaApiMap(), state.getWeb3ApiMap());
        this.subscribeStakingOnChain(address, state.getDotSamaApiMap());
      }
    });

    this.serviceSubscription = state.subscribeServiceInfo().subscribe({
      next: (serviceInfo) => {
        console.log('serviceInfo update', serviceInfo);
        const { address } = serviceInfo.currentAccountInfo;

        state.initChainRegistry();
        this.subscribeBalancesAndCrowdloans(address, serviceInfo.apiMap.dotSama, serviceInfo.apiMap.web3);
        this.subscribeStakingOnChain(address, serviceInfo.apiMap.dotSama);
      }
    });

    this.status = 'running';
  }

  async stop () {
    if (this.status === 'stoped') {
      return;
    }

    if (this.serviceSubscription) {
      this.serviceSubscription.unsubscribe();
      this.serviceSubscription = undefined;
    }

    console.log('Stopping subscrition');
    await this.stopAllSubscription();

    this.status = 'stoped';
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

        this.subscribeBalancesAndCrowdloans(address, state.getDotSamaApiMap(), state.getWeb3ApiMap(), true);
        this.subscribeStakingOnChain(address, state.getDotSamaApiMap(), true);
        // this.stopAllSubscription();
      }
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

  subscribeBalancesAndCrowdloans (address: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, onlyRunOnFirstTime?: boolean) {
    this.unsubBalances && this.unsubBalances();
    this.unsubCrowdloans && this.unsubCrowdloans();
    state.switchAccount(address).catch((err) => console.warn(err));
    this.detectAddresses(address)
      .then((addresses) => {
        this.unsubBalances = this.initBalanceSubscription(addresses, dotSamaApiMap, web3ApiMap, onlyRunOnFirstTime);
        this.unsubCrowdloans = this.initCrowdloanSubscription(addresses, dotSamaApiMap, onlyRunOnFirstTime);
      })
      .catch(console.error);
  }

  subscribeStakingOnChain (address: string, dotSamaApiMap: Record<string, ApiProps>, onlyRunOnFirstTime?: boolean) {
    this.unsubStakingOnChain && this.unsubStakingOnChain();
    state.resetStakingMap(address).then(() => {
      this.detectAddresses(address)
        .then((addresses) => {
          this.unsubStakingOnChain = this.initStakingOnChainSubscription(addresses, dotSamaApiMap, onlyRunOnFirstTime);
        })
        .catch(console.error);
    }).catch((err) => console.warn(err));
  }

  initStakingOnChainSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>, onlyRunOnFirstTime?: boolean) {
    state.setStakingReward({
      ready: false,
      details: []
    } as StakingRewardJson);
    const subscriptionPromise = stakingOnChainApi(addresses, dotSamaApiMap, (networkKey, rs) => {
      state.setStakingItem(networkKey, rs);
    }, state.getNetworkMap());

    if (onlyRunOnFirstTime) {
      subscriptionPromise.then((unsubs) => {
        unsubs.forEach((unsubs) => unsubs && unsubs());
      }).catch(console.error);

      return undefined;
    }

    return async () => {
      const unsubs = await subscriptionPromise;

      unsubs.forEach((unsubs) => unsubs && unsubs());
    };
  }

  initBalanceSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, onlyRunOnFirstTime?: boolean) {
    const subscriptionPromises = subscribeBalance(addresses, dotSamaApiMap, web3ApiMap, (networkKey, rs) => {
      state.setBalanceItem(networkKey, rs);
    });

    if (onlyRunOnFirstTime) {
      subscriptionPromises.forEach((subProm) => {
        subProm.then((unsub) => {
          unsub && unsub();
        }).catch(console.error);
      });

      return undefined;
    }

    return async () => {
      return Promise.all(subscriptionPromises.map(async (subProm) => {
        const unsub = await subProm;

        unsub && unsub();
      }));
    };
  }

  initCrowdloanSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>, onlyRunOnFirstTime?: boolean) {
    const subscriptionPromise = subscribeCrowdloan(addresses, dotSamaApiMap, (networkKey, rs) => {
      state.setCrowdloanItem(networkKey, rs);
    });

    if (onlyRunOnFirstTime) {
      subscriptionPromise.then((unsubMap) => {
        Object.values(unsubMap).forEach((unsub) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          unsub && unsub();
        });
      }).catch(console.error);

      return undefined;
    }

    return async () => {
      const unsubMap = await subscriptionPromise;

      Object.values(unsubMap).forEach((unsub) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        unsub && unsub();
      });
    };
  }

  subscribeNft (address: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, customErc721Registry: CustomEvmToken[]) {
    this.detectAddresses(address)
      .then((addresses) => {
        this.initNftSubscription(addresses, dotSamaApiMap, web3ApiMap, customErc721Registry, address);
      })
      .catch(console.error);
  }

  initNftSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, customErc721Registry: CustomEvmToken[], addressKey: string) {
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
      nftHandler.setWeb3ApiMap(web3ApiMap);
      nftHandler.setAddresses(addresses);
      nftHandler.handleNfts(
        customErc721Registry,
        (data) => {
          state.updateNftData(addressKey, data);
        },
        (data) => {
          if (data !== null) {
            state.updateNftCollection(addressKey, data);
          }
        },
        (ready) => {
          state.updateNftReady(addressKey, ready);
        },
        (networkKey: string, collectionId?: string, nftIds?: string[]) => {
          state.updateNftIds(networkKey, addressKey, collectionId, nftIds);
        })
        .then(() => {
          console.log('nft state updated');
        })
        .catch(console.log);
    }
  }

  async subscribeStakingReward (address: string) {
    const addresses = await this.detectAddresses(address);
    const networkMap = state.getNetworkMap();
    const activeNetworks: string[] = [];

    Object.entries(networkMap).forEach(([key, network]) => {
      if (network.active) {
        activeNetworks.push(key);
      }
    });

    await getAllSubsquidStaking(addresses, activeNetworks, (networkKey, rs) => {
      if (networkKey !== 'polkadot' && networkKey !== 'kusama') { // TODO: temporary fix because subsquid is not real-time
        state.setStakingItem(networkKey, rs);
      }
    })
      .then((result) => {
        state.setStakingReward(result);
        console.log('set staking reward state done', result);
      })
      .catch(console.error);
  }
}
