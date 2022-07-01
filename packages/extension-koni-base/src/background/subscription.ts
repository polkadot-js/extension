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

type SubscriptionName = 'balance' | 'crowdloan' | 'stakingOnChain';

export class KoniSubscription {
  private serviceSubscription: Subscription | undefined;
  private subscriptionMap: Record<SubscriptionName, (() => void) | undefined> = {
    crowdloan: undefined,
    balance: undefined,
    stakingOnChain: undefined
  };

  constructor () {
    this.init();
  }

  getSubscriptionMap () {
    return this.subscriptionMap;
  }

  getSubscription (name: SubscriptionName): (() => void) | undefined {
    return this.subscriptionMap[name];
  }

  updateSubscription (name: SubscriptionName, func: (() => void) | undefined) {
    const oldFunc = this.subscriptionMap[name];

    oldFunc && oldFunc();
    func && (this.subscriptionMap[name] = func);
  }

  stopAllSubscription () {
    if (this.subscriptionMap.balance) {
      this.subscriptionMap.balance();
      delete this.subscriptionMap.balance;
    }

    if (this.subscriptionMap.crowdloan) {
      this.subscriptionMap.crowdloan();
      delete this.subscriptionMap.crowdloan;
    }

    if (this.subscriptionMap.stakingOnChain) {
      this.subscriptionMap.stakingOnChain();
      delete this.subscriptionMap.stakingOnChain;
    }
  }

  start () {
    console.log('Stating subscrition');
    state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo) {
        const { address } = currentAccountInfo;

        this.subscribeBalancesAndCrowdloans(address, state.getDotSamaApiMap(), state.getWeb3ApiMap());
        this.subscribeStakingOnChain(address, state.getDotSamaApiMap());
      }
    });

    !this.serviceSubscription &&
      (this.serviceSubscription = state.subscribeServiceInfo().subscribe({
        next: (serviceInfo) => {
          console.log('serviceInfo update', serviceInfo);
          const { address } = serviceInfo.currentAccountInfo;

          state.initChainRegistry();
          this.subscribeBalancesAndCrowdloans(address, serviceInfo.apiMap.dotSama, serviceInfo.apiMap.web3);
          this.subscribeStakingOnChain(address, serviceInfo.apiMap.dotSama);
        }
      }));
  }

  stop () {
    console.log('Stopping subscrition');

    if (this.serviceSubscription) {
      this.serviceSubscription.unsubscribe();
      this.serviceSubscription = undefined;
    }

    this.stopAllSubscription();
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
    return new Promise<Array<string>>((resolve) => {
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
    state.switchAccount(address).then(() => {
      this.detectAddresses(address)
        .then((addresses) => {
          this.updateSubscription('balance', this.initBalanceSubscription(addresses, dotSamaApiMap, web3ApiMap, onlyRunOnFirstTime));
          this.updateSubscription('crowdloan', this.initCrowdloanSubscription(addresses, dotSamaApiMap, onlyRunOnFirstTime));
        })
        .catch(console.error);
    }).catch((err) => console.warn(err));
  }

  subscribeStakingOnChain (address: string, dotSamaApiMap: Record<string, ApiProps>, onlyRunOnFirstTime?: boolean) {
    state.resetStakingMap(address).then(() => {
      this.detectAddresses(address)
        .then((addresses) => {
          this.updateSubscription('stakingOnChain', this.initStakingOnChainSubscription(addresses, dotSamaApiMap, onlyRunOnFirstTime));
        })
        .catch(console.error);
    }).catch((err) => console.warn(err));
  }

  initStakingOnChainSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>, onlyRunOnFirstTime?: boolean) {
    const unsub = stakingOnChainApi(addresses, dotSamaApiMap, (networkKey, rs) => {
      state.setStakingItem(networkKey, rs);
    }, state.getNetworkMap());

    if (onlyRunOnFirstTime) {
      unsub && unsub();

      return;
    }

    return () => {
      unsub && unsub();
    };
  }

  initBalanceSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, onlyRunOnFirstTime?: boolean) {
    const unsub = subscribeBalance(addresses, dotSamaApiMap, web3ApiMap, (networkKey, rs) => {
      state.setBalanceItem(networkKey, rs);
    });

    if (onlyRunOnFirstTime) {
      unsub && unsub();

      return;
    }

    return () => {
      unsub && unsub();
    };
  }

  initCrowdloanSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>, onlyRunOnFirstTime?: boolean) {
    const subscriptionPromise = subscribeCrowdloan(addresses, dotSamaApiMap, (networkKey, rs) => {
      state.setCrowdloanItem(networkKey, rs);
    });

    if (onlyRunOnFirstTime) {
      subscriptionPromise.then((unsub) => unsub()).catch(console.warn);

      return;
    }

    return () => {
      subscriptionPromise.then((unsub) => unsub()).catch(console.warn);
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
        },
        (networkKey: string, collectionIds?: string[]) => {
          state.updateCollectionIds(networkKey, addressKey, collectionIds);
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
      if (networkKey !== 'polkadot' && networkKey !== 'kusama' && networkKey !== 'hydradx') { // TODO: temporary fix because subsquid is not real-time
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
