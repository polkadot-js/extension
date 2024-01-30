// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { StakingRewardItem } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeCrowdloan } from '@subwallet/extension-base/koni/api/dotsama/crowdloan';
import { NftHandler } from '@subwallet/extension-base/koni/api/nft';
import { getNominationStakingRewardData } from '@subwallet/extension-base/koni/api/staking';
import { subscribeBalance } from '@subwallet/extension-base/services/balance-service/helpers/subscribe/balance';
import { _ChainState, _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _isChainEnabled, _isChainSupportSubstrateStaking } from '@subwallet/extension-base/services/chain-service/utils';
import { COMMON_RELOAD_EVENTS, EventItem, EventType } from '@subwallet/extension-base/services/event-service/types';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { waitTimeout } from '@subwallet/extension-base/utils';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

import KoniState from './handlers/State';

type SubscriptionName = 'balance' | 'crowdloan' | 'yieldPoolStats' | 'yieldPosition';

const nftHandler = new NftHandler();

export class KoniSubscription {
  private eventHandler?: (events: EventItem<EventType>[], eventTypes: EventType[]) => void;
  private subscriptionMap: Record<SubscriptionName, (() => void) | undefined> = {
    crowdloan: undefined,
    balance: undefined,
    yieldPoolStats: undefined,
    yieldPosition: undefined
  };

  public dbService: DatabaseService;
  private state: KoniState;
  private logger: Logger;

  constructor (state: KoniState, dbService: DatabaseService) {
    this.dbService = dbService;
    this.state = state;
    this.logger = createLogger('Subscription');
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
  }

  async start () {
    await Promise.all([this.state.eventService.waitCryptoReady, this.state.eventService.waitKeyringReady, this.state.eventService.waitAssetReady]);
    const currentAddress = this.state.keyringService.currentAccount?.address;

    if (currentAddress) {
      this.subscribeBalances(currentAddress, this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap(), this.state.getEvmApiMap());
      this.subscribeCrowdloans(currentAddress, this.state.getSubstrateApiMap());
    }

    this.eventHandler = (events, eventTypes) => {
      const serviceInfo = this.state.getServiceInfo();
      const needReload = eventTypes.some((eventType) => COMMON_RELOAD_EVENTS.includes(eventType));

      if (!needReload) {
        return;
      }

      const address = serviceInfo.currentAccountInfo?.address;

      if (!address) {
        return;
      }

      this.subscribeBalances(address, serviceInfo.chainInfoMap, serviceInfo.chainStateMap, serviceInfo.chainApiMap.substrate, serviceInfo.chainApiMap.evm);
      this.subscribeCrowdloans(address, serviceInfo.chainApiMap.substrate);
    };

    this.state.eventService.onLazy(this.eventHandler.bind(this));
  }

  async stop () {
    if (this.eventHandler) {
      this.state.eventService.offLazy(this.eventHandler);
      this.eventHandler = undefined;
    }

    this.stopAllSubscription();

    return Promise.resolve();
  }

  subscribeBalances (address: string, chainInfoMap: Record<string, _ChainInfo>, chainStateMap: Record<string, _ChainState>, substrateApiMap: Record<string, _SubstrateApi>, web3ApiMap: Record<string, _EvmApi>, onlyRunOnFirstTime?: boolean) {
    const addresses = this.state.getDecodedAddresses(address);

    if (!addresses.length) {
      return;
    }

    this.state.handleResetBalance(address).then(() => {
      this.updateSubscription('balance', this.initBalanceSubscription(addresses, chainInfoMap, chainStateMap, substrateApiMap, web3ApiMap, onlyRunOnFirstTime));
    }).catch((err) => this.logger.warn(err));
  }

  subscribeCrowdloans (address: string, substrateApiMap: Record<string, _SubstrateApi>, onlyRunOnFirstTime?: boolean) {
    const addresses = this.state.getDecodedAddresses(address);

    if (!addresses.length) {
      return;
    }

    this.state.resetCrowdloanMap(address).then(() => {
      this.updateSubscription('crowdloan', this.initCrowdloanSubscription(addresses, substrateApiMap, onlyRunOnFirstTime));
    }).catch(console.error);
  }

  initBalanceSubscription (addresses: string[], chainInfoMap: Record<string, _ChainInfo>, chainStateMap: Record<string, _ChainState>, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, onlyRunOnFirstTime?: boolean) {
    const filteredChainInfoMap: Record<string, _ChainInfo> = {};

    Object.values(chainStateMap).forEach((chainState) => {
      if (chainState.active) {
        filteredChainInfoMap[chainState.slug] = chainInfoMap[chainState.slug];
      }
    });

    const unsub = subscribeBalance(addresses, filteredChainInfoMap, substrateApiMap, evmApiMap, (result) => {
      this.state.setBalanceItem(result);
    });

    const unsub2 = this.state.subscribeMantaPayBalance();

    if (onlyRunOnFirstTime) {
      unsub && unsub();
      unsub2 && unsub2();

      return;
    }

    return () => {
      unsub && unsub();
      unsub2 && unsub2();
    };
  }

  initCrowdloanSubscription (addresses: string[], substrateApiMap: Record<string, _SubstrateApi>, onlyRunOnFirstTime?: boolean) {
    const subscriptionPromise = subscribeCrowdloan(addresses, substrateApiMap, (networkKey, rs) => {
      this.state.setCrowdloanItem(networkKey, rs);
    });

    if (onlyRunOnFirstTime) {
      subscriptionPromise.then((unsub) => unsub?.()).catch(this.logger.warn);

      return;
    }

    return () => {
      subscriptionPromise.then((unsub) => unsub?.()).catch(this.logger.warn);
    };
  }

  subscribeNft (address: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, smartContractNfts: _ChainAsset[], chainInfoMap: Record<string, _ChainInfo>) {
    const addresses = this.state.getDecodedAddresses(address);

    if (!addresses.length) {
      return;
    }

    this.initNftSubscription(addresses, substrateApiMap, evmApiMap, smartContractNfts, chainInfoMap);
  }

  initNftSubscription (addresses: string[], substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, smartContractNfts: _ChainAsset[], chainInfoMap: Record<string, _ChainInfo>) {
    nftHandler.setChainInfoMap(chainInfoMap);
    nftHandler.setDotSamaApiMap(substrateApiMap);
    nftHandler.setWeb3ApiMap(evmApiMap);
    nftHandler.setAddresses(addresses);

    nftHandler.handleNfts(
      smartContractNfts,
      (...args) => this.state.updateNftData(...args),
      (...args) => this.state.setNftCollection(...args)
    ).catch(this.logger.log);
  }

  async subscribeStakingReward (address: string) {
    const addresses = this.state.getDecodedAddresses(address);

    if (!addresses.length) {
      return;
    }

    const chainInfoMap = this.state.getChainInfoMap();
    const targetNetworkMap: Record<string, _ChainInfo> = {};

    Object.entries(chainInfoMap).forEach(([key, network]) => {
      const chainState = this.state.getChainStateByKey(key);

      if (_isChainEnabled(chainState) && _isChainSupportSubstrateStaking(network)) {
        targetNetworkMap[key] = network;
      }
    });

    await getNominationStakingRewardData(addresses, targetNetworkMap, (rewardItem: StakingRewardItem) => {
      this.state.updateStakingReward(rewardItem);
    });
  }

  async reloadBalance () {
    const currentAddress = this.state.keyringService.currentAccount?.address;

    await this.state.handleResetBalance(currentAddress, true);
    this.subscribeBalances(currentAddress, this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap(), this.state.getEvmApiMap());

    await waitTimeout(1800);
  }

  async reloadCrowdloan () {
    const currentAddress = this.state.keyringService.currentAccount?.address;

    this.subscribeCrowdloans(currentAddress, this.state.getSubstrateApiMap());

    await waitTimeout(1800);
  }
}
