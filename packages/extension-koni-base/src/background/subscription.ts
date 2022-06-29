// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { ApiProps, CustomEvmToken, NftTransferExtra } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { subscribeCrowdloan } from '@subwallet/extension-koni-base/api/dotsama/crowdloan';
import { stakingOnChainApi } from '@subwallet/extension-koni-base/api/staking';
import { getAllSubsquidStaking } from '@subwallet/extension-koni-base/api/staking/subsquidStaking';
import { nftHandler, state } from '@subwallet/extension-koni-base/background/handlers';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-koni-base/constants';
import { take } from 'rxjs';
import Web3 from 'web3';

import { accounts as accountsObservable } from '@polkadot/ui-keyring/observable/accounts';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

export class KoniSubscription {
  private subscriptionMap: Record<string, any> = {};
  // @ts-ignore
  unsubBalances: () => void | undefined;
  // @ts-ignore
  unsubCrowdloans: () => void | undefined;
  // @ts-ignore
  unsubStakingOnChain: () => void | undefined;

  getSubscriptionMap () {
    return this.subscriptionMap;
  }

  getSubscription (name: string): any {
    return this.subscriptionMap[name];
  }

  init () {
    state.mergeTransactionHistory();

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

        this.subscribeBalancesAndCrowdloans(address, state.getDotSamaApiMap(), state.getWeb3ApiMap());
        this.subscribeStakingOnChain(address, state.getDotSamaApiMap());
      }

      state.subscribeServiceInfo().subscribe({
        next: (serviceInfo) => {
          console.log('serviceInfo update', serviceInfo);
          const { address } = serviceInfo.currentAccountInfo;

          state.initChainRegistry();
          this.subscribeBalancesAndCrowdloans(address, serviceInfo.apiMap.dotSama, serviceInfo.apiMap.web3);
          this.subscribeStakingOnChain(address, serviceInfo.apiMap.dotSama);
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

  subscribeBalancesAndCrowdloans (address: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>) {
    this.unsubBalances && this.unsubBalances();
    this.unsubCrowdloans && this.unsubCrowdloans();
    state.resetBalanceMap();
    state.resetCrowdloanMap();
    this.detectAddresses(address)
      .then((addresses) => {
        this.unsubBalances = this.initBalanceSubscription(addresses, dotSamaApiMap, web3ApiMap);
        this.unsubCrowdloans = this.initCrowdloanSubscription(addresses, dotSamaApiMap);
      })
      .catch(console.error);
  }

  subscribeStakingOnChain (address: string, dotSamaApiMap: Record<string, ApiProps>) {
    this.unsubStakingOnChain && this.unsubStakingOnChain();
    state.resetStakingMap();
    this.detectAddresses(address)
      .then((addresses) => {
        this.unsubStakingOnChain = this.initStakingOnChainSubscription(addresses, dotSamaApiMap);
      })
      .catch(console.error);
  }

  initStakingOnChainSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>) {
    const subscriptionPromises = stakingOnChainApi(addresses, dotSamaApiMap, (networkKey, rs) => {
      state.setStakingItem(networkKey, rs);
    }, state.getNetworkMap());

    return () => {
      subscriptionPromises.then((unsubs) => {
        unsubs.forEach((unsubs) => unsubs && unsubs());
      }).catch(console.error);
    };
  }

  initBalanceSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>) {
    const subscriptionPromises = subscribeBalance(addresses, dotSamaApiMap, web3ApiMap, (networkKey, rs) => {
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

  subscribeNft (address: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, customErc721Registry: CustomEvmToken[]) {
    this.detectAddresses(address)
      .then((addresses) => {
        this.initNftSubscription(addresses, dotSamaApiMap, web3ApiMap, customErc721Registry);
      })
      .catch(console.error);
  }

  initNftSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, customErc721Registry: CustomEvmToken[]) {
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
    const networkMap = state.getNetworkMap();
    const activeNetworks: string[] = [];

    Object.entries(networkMap).forEach(([key, network]) => {
      if (network.active) {
        activeNetworks.push(key);
      }
    });

    await getAllSubsquidStaking(addresses, activeNetworks)
      .then((result) => {
        state.setStakingReward(result);
        console.log('set staking reward state done', result);
      })
      .catch(console.error);
  }
}
