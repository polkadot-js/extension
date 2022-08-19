// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { ApiProps, CustomEvmToken, NetworkJson, NftTransferExtra, UnlockingStakeInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getUnlockingInfo } from '@subwallet/extension-koni-base/api/bonding';
import { subscribeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { subscribeCrowdloan } from '@subwallet/extension-koni-base/api/dotsama/crowdloan';
import { stakingOnChainApi } from '@subwallet/extension-koni-base/api/staking';
import { getAllSubsquidStaking } from '@subwallet/extension-koni-base/api/staking/subsquidStaking';
import { nftHandler } from '@subwallet/extension-koni-base/background/handlers';
import { Subscription } from 'rxjs';
import Web3 from 'web3';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';
import { isEthereumAddress } from '@polkadot/util-crypto';

import DatabaseService from '../services/DatabaseService';
import KoniState from './handlers/State';

type SubscriptionName = 'balance' | 'crowdloan' | 'stakingOnChain';

export class KoniSubscription {
  private serviceSubscription: Subscription | undefined;
  private subscriptionMap: Record<SubscriptionName, (() => void) | undefined> = {
    crowdloan: undefined,
    balance: undefined,
    stakingOnChain: undefined
  };

  public dbService: DatabaseService;
  private state: KoniState;
  private logger: Logger;

  constructor (state: KoniState, dbService: DatabaseService) {
    this.dbService = dbService;
    this.state = state;
    this.logger = createLogger('Subscription');
    // this.init();
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
    this.logger.log('Stating subscrition');
    this.state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo) {
        const { address } = currentAccountInfo;

        this.subscribeBalancesAndCrowdloans(address, this.state.getDotSamaApiMap(), this.state.getWeb3ApiMap());
        this.subscribeStakingOnChain(address, this.state.getDotSamaApiMap());
      }
    });

    !this.serviceSubscription &&
      (this.serviceSubscription = this.state.subscribeServiceInfo().subscribe({
        next: (serviceInfo) => {
          this.logger.log('serviceInfo update', serviceInfo);
          const { address } = serviceInfo.currentAccountInfo;

          this.state.initChainRegistry();
          this.subscribeBalancesAndCrowdloans(address, serviceInfo.apiMap.dotSama, serviceInfo.apiMap.web3);
          this.subscribeStakingOnChain(address, serviceInfo.apiMap.dotSama);
        }
      }));
  }

  stop () {
    this.logger.log('Stopping subscrition');

    if (this.serviceSubscription) {
      this.serviceSubscription.unsubscribe();
      this.serviceSubscription = undefined;
    }

    this.stopAllSubscription();
  }

  init () {
    this.state.getAuthorize((value) => {
      const authString = localStorage.getItem('authUrls') || '{}';
      const previousAuth = JSON.parse(authString) as AuthUrls;

      if (previousAuth && Object.keys(previousAuth).length) {
        Object.keys(previousAuth).forEach((url) => {
          if (previousAuth[url].isAllowed) {
            previousAuth[url].isAllowedMap = this.state.getAddressList(true);
          } else {
            previousAuth[url].isAllowedMap = this.state.getAddressList();
          }
        });
      }

      const migrateValue = { ...previousAuth, ...value };

      this.state.setAuthorize(migrateValue);
      localStorage.setItem('authUrls', '{}');
    });

    this.state.fetchCrowdloanFundMap().then(this.logger.log).catch(this.logger.error);

    this.state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo) {
        const { address } = currentAccountInfo;

        this.subscribeBalancesAndCrowdloans(address, this.state.getDotSamaApiMap(), this.state.getWeb3ApiMap(), true);
        this.subscribeStakingOnChain(address, this.state.getDotSamaApiMap(), true);
        // this.stopAllSubscription();
      }
    });
  }

  subscribeBalancesAndCrowdloans (address: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, onlyRunOnFirstTime?: boolean) {
    this.state.switchAccount(address).then(() => {
      this.state.getDecodedAddresses(address)
        .then((addresses) => {
          if (!addresses.length) {
            return;
          }

          this.updateSubscription('balance', this.initBalanceSubscription(address, addresses, dotSamaApiMap, web3ApiMap, onlyRunOnFirstTime));
          this.updateSubscription('crowdloan', this.initCrowdloanSubscription(addresses, dotSamaApiMap, onlyRunOnFirstTime));
        })
        .catch(this.logger.error);
    }).catch((err) => this.logger.warn(err));
  }

  subscribeStakingOnChain (address: string, dotSamaApiMap: Record<string, ApiProps>, onlyRunOnFirstTime?: boolean) {
    this.state.resetStakingMap(address).then(() => {
      this.state.getDecodedAddresses(address)
        .then((addresses) => {
          if (!addresses.length) {
            return;
          }

          this.updateSubscription('stakingOnChain', this.initStakingOnChainSubscription(addresses, dotSamaApiMap, onlyRunOnFirstTime));
        })
        .catch(this.logger.error);
    }).catch((err) => this.logger.warn(err));
  }

  initStakingOnChainSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>, onlyRunOnFirstTime?: boolean) {
    const unsub = stakingOnChainApi(addresses, dotSamaApiMap, (networkKey, rs) => {
      this.state.setStakingItem(networkKey, rs);
    }, this.state.getNetworkMap());

    if (onlyRunOnFirstTime) {
      unsub && unsub();

      return;
    }

    return () => {
      unsub && unsub();
    };
  }

  initBalanceSubscription (key: string, addresses: string[], dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, onlyRunOnFirstTime?: boolean) {
    const unsub = subscribeBalance(addresses, dotSamaApiMap, web3ApiMap, (networkKey, rs) => {
      this.state.setBalanceItem(networkKey, rs);
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
      this.state.setCrowdloanItem(networkKey, rs);
    });

    if (onlyRunOnFirstTime) {
      subscriptionPromise.then((unsub) => unsub()).catch(this.logger.warn);

      return;
    }

    return () => {
      subscriptionPromise.then((unsub) => unsub()).catch(this.logger.warn);
    };
  }

  subscribeNft (address: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, customErc721Registry: CustomEvmToken[]) {
    this.state.getDecodedAddresses(address)
      .then((addresses) => {
        if (!addresses.length) {
          return;
        }

        this.initNftSubscription(addresses, dotSamaApiMap, web3ApiMap, customErc721Registry);
      })
      .catch(this.logger.error);
  }

  initNftSubscription (addresses: string[], dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, customErc721Registry: CustomEvmToken[]) {
    const { cronUpdate, forceUpdate, selectedNftCollection } = this.state.getNftTransfer();

    if (forceUpdate && !cronUpdate) {
      this.logger.log('skipping set nft state due to transfer');
      this.state.setNftTransfer({
        cronUpdate: true,
        forceUpdate: true,
        selectedNftCollection
      } as NftTransferExtra);
    } else { // after skipping 1 time of cron update
      this.state.setNftTransfer({
        cronUpdate: false,
        forceUpdate: false,
        selectedNftCollection
      } as NftTransferExtra);
      nftHandler.setApiProps(dotSamaApiMap);
      nftHandler.setWeb3ApiMap(web3ApiMap);
      nftHandler.setAddresses(addresses);
      nftHandler.handleNfts(
        customErc721Registry,
        (...args) => this.state.updateNftData(...args),
        (...args) => this.state.setNftCollection(...args),
        (...args) => this.state.updateNftIds(...args),
        (...args) => this.state.updateCollectionIds(...args))
        .then(() => {
          this.logger.log('nft state updated');
        })
        .catch(this.logger.log);
    }
  }

  async subscribeStakingReward (address: string) {
    const addresses = await this.state.getDecodedAddresses(address);
    const networkMap = this.state.getNetworkMap();
    const activeNetworks: string[] = [];

    if (!addresses.length) {
      return;
    }

    Object.entries(networkMap).forEach(([key, network]) => {
      if (network.active) {
        activeNetworks.push(key);
      }
    });

    getAllSubsquidStaking(addresses, activeNetworks)
      .then((result) => {
        this.state.setStakingReward(result);
        this.logger.log('set staking reward state done', result);
      })
      .catch(this.logger.error);
  }

  async subscribeStakeUnlockingInfo (address: string, networkMap: Record<string, NetworkJson>, dotSamaApiMap: Record<string, ApiProps>) {
    const addresses = await this.state.getDecodedAddresses(address);
    const currentAddress = addresses[0]; // only get info for the current account

    const stakeUnlockingInfo: Record<string, UnlockingStakeInfo> = {};

    const currentStakingInfo = this.state.getStaking().details;

    if (!addresses.length) {
      return;
    }

    await Promise.all(Object.entries(networkMap).map(async ([networkKey, networkJson]) => {
      const needUpdateUnlockingStake = currentStakingInfo[networkKey] && currentStakingInfo[networkKey].balance && parseFloat(currentStakingInfo[networkKey].balance as string) > 0;

      if (isEthereumAddress(currentAddress)) {
        if (networkJson.supportBonding && networkJson.active && networkJson.isEthereum && needUpdateUnlockingStake) {
          stakeUnlockingInfo[networkKey] = await getUnlockingInfo(dotSamaApiMap[networkKey], networkJson, networkKey, currentAddress);
        }
      } else {
        if (networkJson.supportBonding && networkJson.active && !networkJson.isEthereum && needUpdateUnlockingStake) {
          stakeUnlockingInfo[networkKey] = await getUnlockingInfo(dotSamaApiMap[networkKey], networkJson, networkKey, currentAddress);
        }
      }
    }));

    this.state.setStakeUnlockingInfo({
      timestamp: +new Date(),
      details: stakeUnlockingInfo
    });
  }
}
