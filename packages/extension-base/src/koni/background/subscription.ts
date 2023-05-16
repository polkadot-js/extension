// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ChainStakingMetadata } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { subscribeBalance } from '@subwallet/extension-base/koni/api/dotsama/balance';
import { subscribeCrowdloan } from '@subwallet/extension-base/koni/api/dotsama/crowdloan';
import { getNominationStakingRewardData, getPoolingStakingRewardData, stakingOnChainApi } from '@subwallet/extension-base/koni/api/staking';
import { getChainStakingMetadata, getNominatorMetadata } from '@subwallet/extension-base/koni/api/staking/bonding';
import { getRelayChainPoolMemberMetadata } from '@subwallet/extension-base/koni/api/staking/bonding/relayChain';
import { getAmplitudeUnclaimedStakingReward } from '@subwallet/extension-base/koni/api/staking/paraChain';
import { nftHandler } from '@subwallet/extension-base/koni/background/handlers';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _ChainState, _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _isChainEnabled, _isChainEvmCompatible, _isChainSupportSubstrateStaking, _isSubstrateRelayChain } from '@subwallet/extension-base/services/chain-service/utils';
import { COMMON_RELOAD_EVENTS, EventItem, EventType } from '@subwallet/extension-base/services/event-service/types';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import axios from 'axios';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';
import { isEthereumAddress } from '@polkadot/util-crypto';

import KoniState from './handlers/State';

type SubscriptionName = 'balance' | 'crowdloan' | 'stakingOnChain';

export class KoniSubscription {
  private eventHandler?: (events: EventItem<EventType>[], eventTypes: EventType[]) => void;
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
    this.logger.log('Starting subscription');
    const currentAddress = this.state.keyringService.currentAccount?.address;

    if (currentAddress) {
      this.subscribeBalancesAndCrowdloans(currentAddress, this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap(), this.state.getEvmApiMap());
      this.subscribeStakingOnChain(currentAddress, this.state.getSubstrateApiMap());
    }

    this.eventHandler = (events, eventTypes) => {
      const serviceInfo = this.state.getServiceInfo();
      const needReload = eventTypes.some((eventType) => COMMON_RELOAD_EVENTS.includes(eventType));

      if (!needReload) {
        return;
      }

      this.logger.log('ServiceInfo updated, restarting...');
      const address = serviceInfo.currentAccountInfo?.address;

      if (!address) {
        return;
      }

      this.subscribeBalancesAndCrowdloans(address, serviceInfo.chainInfoMap, serviceInfo.chainStateMap, serviceInfo.chainApiMap.substrate, serviceInfo.chainApiMap.evm);
      this.subscribeStakingOnChain(address, serviceInfo.chainApiMap.substrate);
    };

    this.state.eventService.onLazy(this.eventHandler);
  }

  stop () {
    this.logger.log('Stopping subscription');

    if (this.eventHandler) {
      this.state.eventService.offLazy(this.eventHandler);
      this.eventHandler = undefined;
    }

    this.stopAllSubscription();
  }

  init () {
    this.logger.log('Initializing subscription');
  }

  subscribeBalancesAndCrowdloans (address: string, chainInfoMap: Record<string, _ChainInfo>, chainStateMap: Record<string, _ChainState>, substrateApiMap: Record<string, _SubstrateApi>, web3ApiMap: Record<string, _EvmApi>, onlyRunOnFirstTime?: boolean) {
    this.state.handleSwitchAccount(address).then(() => {
      const addresses = this.state.getDecodedAddresses(address);

      if (!addresses.length) {
        return;
      }

      this.updateSubscription('balance', this.initBalanceSubscription(addresses, chainInfoMap, chainStateMap, substrateApiMap, web3ApiMap, onlyRunOnFirstTime));
      this.updateSubscription('crowdloan', this.initCrowdloanSubscription(addresses, substrateApiMap, onlyRunOnFirstTime));
    }).catch((err) => this.logger.warn(err));
  }

  subscribeStakingOnChain (address: string, substrateApiMap: Record<string, _SubstrateApi>, onlyRunOnFirstTime?: boolean) {
    this.state.resetStaking(address);
    const addresses = this.state.getDecodedAddresses(address);

    if (!addresses.length) {
      return;
    }

    this.updateSubscription('stakingOnChain', this.initStakingOnChainSubscription(addresses, substrateApiMap, onlyRunOnFirstTime));
  }

  initStakingOnChainSubscription (addresses: string[], substrateApiMap: Record<string, _SubstrateApi>, onlyRunOnFirstTime?: boolean) {
    const unsub = stakingOnChainApi(addresses, substrateApiMap, (networkKey, rs) => {
      this.state.setStakingItem(networkKey, rs);
    }, this.state.getActiveChainInfoMap());

    if (onlyRunOnFirstTime) {
      unsub && unsub();

      return;
    }

    return () => {
      unsub && unsub();
    };
  }

  initBalanceSubscription (addresses: string[], chainInfoMap: Record<string, _ChainInfo>, chainStateMap: Record<string, _ChainState>, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, onlyRunOnFirstTime?: boolean) {
    const filteredChainInfoMap: Record<string, _ChainInfo> = {};

    Object.values(chainStateMap).forEach((chainState) => {
      if (chainState.active) {
        filteredChainInfoMap[chainState.slug] = chainInfoMap[chainState.slug];
      }
    });

    const unsub = subscribeBalance(addresses, filteredChainInfoMap, substrateApiMap, evmApiMap, (result) => {
      this.state.setBalanceItem(result.tokenSlug, result);
    });

    if (onlyRunOnFirstTime) {
      unsub && unsub();

      return;
    }

    return () => {
      unsub && unsub();
    };
  }

  initCrowdloanSubscription (addresses: string[], substrateApiMap: Record<string, _SubstrateApi>, onlyRunOnFirstTime?: boolean) {
    const subscriptionPromise = subscribeCrowdloan(addresses, substrateApiMap, (networkKey, rs) => {
      this.state.setCrowdloanItem(networkKey, rs);
    }, this.state.getChainInfoMap());

    if (onlyRunOnFirstTime) {
      subscriptionPromise.then((unsub) => unsub()).catch(this.logger.warn);

      return;
    }

    return () => {
      subscriptionPromise.then((unsub) => unsub()).catch(this.logger.warn);
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
      (...args) => this.state.setNftCollection(...args),
      (...args) => this.state.cleanUpNfts(...args)
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

    const result = await getNominationStakingRewardData(addresses, targetNetworkMap);

    this.state.updateStakingReward(result, 'slowInterval');
  }

  async subscribeStakingRewardFastInterval (address: string) {
    const addresses = this.state.getDecodedAddresses(address);

    if (!addresses.length) {
      return;
    }

    const pooledStakingItems = await this.state.getPooledStakingRecordsByAddress(addresses);

    const pooledAddresses: string[] = [];

    pooledStakingItems.forEach((pooledItem) => {
      if (!pooledAddresses.includes(pooledItem.address)) {
        pooledAddresses.push(pooledItem.address);
      }
    });

    const chainInfoMap = this.state.getChainInfoMap();
    const targetChainMap: Record<string, _ChainInfo> = {};

    Object.entries(chainInfoMap).forEach(([key, network]) => {
      const chainState = this.state.getChainStateByKey(key);

      if (_isChainEnabled(chainState) && _isChainSupportSubstrateStaking(network)) {
        targetChainMap[key] = network;
      }
    });

    const activeNetworks: string[] = [];

    Object.keys(targetChainMap).forEach((key) => {
      activeNetworks.push(key);
    });

    const [poolingStakingRewards, amplitudeUnclaimedStakingRewards] = await Promise.all([
      getPoolingStakingRewardData(pooledAddresses, targetChainMap, this.state.getSubstrateApiMap()),
      getAmplitudeUnclaimedStakingReward(this.state.getSubstrateApiMap(), addresses, chainInfoMap, activeNetworks)
    ]);

    const result = [...poolingStakingRewards, ...amplitudeUnclaimedStakingRewards];

    this.state.updateStakingReward(result, 'fastInterval');
  }

  async fetchingStakingFromApi (): Promise<Record<string, ChainStakingMetadata>> {
    try {
      const response = await axios.get('https://staking-data.subwallet.app/api/staking/get');

      if (response.status === 200) {
        return response.data as Record<string, ChainStakingMetadata>;
      }
    } catch (e) {
      this.logger.error(e);
    }

    return {};
  }

  async fetchChainStakingMetadata (chainInfoMap: Record<string, _ChainInfo>, chainStateMap: Record<string, _ChainState>, substrateApiMap: Record<string, _SubstrateApi>) {
    const filteredChainInfoMap: Record<string, _ChainInfo> = {};

    Object.values(chainInfoMap).forEach((chainInfo) => {
      const chainState = chainStateMap[chainInfo.slug];

      if (chainState?.active && _isChainSupportSubstrateStaking(chainInfo)) {
        filteredChainInfoMap[chainInfo.slug] = chainInfo;
      }
    });

    if (Object.values(filteredChainInfoMap).length === 0) {
      return;
    }

    // Fetch data from helper API
    const dataFromApi = await this.fetchingStakingFromApi();

    await Promise.all(Object.values(filteredChainInfoMap).map(async (chainInfo) => {
      // Use fetch API data if available
      if (dataFromApi[chainInfo.slug]) {
        this.state.updateChainStakingMetadata(dataFromApi[chainInfo.slug]);
      } else {
        console.warn('Not found staking data from api', chainInfo.slug);
        const chainStakingMetadata = await getChainStakingMetadata(chainInfo, substrateApiMap[chainInfo.slug]);

        this.state.updateChainStakingMetadata(chainStakingMetadata);
      }
    }));
  }

  async fetchNominatorMetadata (currentAddress: string, chainInfoMap: Record<string, _ChainInfo>, chainStateMap: Record<string, _ChainState>, substrateApiMap: Record<string, _SubstrateApi>) {
    const filteredChainInfoMap: Record<string, _ChainInfo> = {};

    Object.values(chainInfoMap).forEach((chainInfo) => {
      const chainState = chainStateMap[chainInfo.slug];

      if (chainState?.active && _isChainSupportSubstrateStaking(chainInfo)) {
        filteredChainInfoMap[chainInfo.slug] = chainInfo;
      }
    });

    let addresses = [currentAddress];

    if (currentAddress === ALL_ACCOUNT_KEY) {
      addresses = await this.state.getStakingOwnersByChains(Object.keys(filteredChainInfoMap));
    }

    await Promise.all(addresses.map(async (address) => {
      const isEvmAddress = isEthereumAddress(address);

      await Promise.all(Object.values(filteredChainInfoMap).map(async (chainInfo) => {
        if (isEvmAddress && !_isChainEvmCompatible(chainInfo)) {
          return;
        }

        if (_isSubstrateRelayChain(chainInfo) && _STAKING_CHAIN_GROUP.nominationPool.includes(chainInfo.slug)) {
          const poolMemberMetadata = await getRelayChainPoolMemberMetadata(chainInfo, address, substrateApiMap[chainInfo.slug]);

          if (poolMemberMetadata) {
            this.state.updateStakingNominatorMetadata(poolMemberMetadata);
          }
        }

        const nominatorMetadata = await getNominatorMetadata(chainInfo, address, substrateApiMap[chainInfo.slug]);

        if (nominatorMetadata) {
          this.state.updateStakingNominatorMetadata(nominatorMetadata);
        }
      }));
    }));
  }
}
