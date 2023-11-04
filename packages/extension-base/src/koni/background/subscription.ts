// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { NominatorMetadata, StakingItem, StakingRewardItem, YieldPoolInfo, YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeBalance } from '@subwallet/extension-base/koni/api/dotsama/balance';
import { subscribeCrowdloan } from '@subwallet/extension-base/koni/api/dotsama/crowdloan';
import { getNominationStakingRewardData, getPoolingStakingRewardData, stakingOnChainApi } from '@subwallet/extension-base/koni/api/staking';
import { subscribeEssentialChainStakingMetadata } from '@subwallet/extension-base/koni/api/staking/bonding';
import { getAmplitudeUnclaimedStakingReward } from '@subwallet/extension-base/koni/api/staking/paraChain';
import { subscribeYieldPoolStats, subscribeYieldPosition } from '@subwallet/extension-base/koni/api/yield';
import { nftHandler } from '@subwallet/extension-base/koni/background/handlers';
import { SubstrateApi } from '@subwallet/extension-base/services/chain-service/handler/SubstrateApi';
import { _ChainState, _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _isChainEnabled, _isChainSupportSubstrateStaking } from '@subwallet/extension-base/services/chain-service/utils';
import { COMMON_RELOAD_EVENTS, EventItem, EventType } from '@subwallet/extension-base/services/event-service/types';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { waitTimeout } from '@subwallet/extension-base/utils';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

import KoniState from './handlers/State';

type SubscriptionName = 'balance' | 'crowdloan' | 'stakingOnChain' | 'essentialChainStakingMetadata' | 'yieldPoolStats' | 'yieldPosition';

export class KoniSubscription {
  private eventHandler?: (events: EventItem<EventType>[], eventTypes: EventType[]) => void;
  private subscriptionMap: Record<SubscriptionName, (() => void) | undefined> = {
    crowdloan: undefined,
    balance: undefined,
    stakingOnChain: undefined,
    essentialChainStakingMetadata: undefined,
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

    if (this.subscriptionMap.stakingOnChain) {
      this.subscriptionMap.stakingOnChain();
      delete this.subscriptionMap.stakingOnChain;
    }
  }

  async start () {
    await Promise.all([this.state.eventService.waitKeyringReady, this.state.eventService.waitAssetReady]);
    const currentAddress = this.state.keyringService.currentAccount?.address;

    this.subscribeYieldPools(this.state.getChainInfoMap(), this.state.getAssetRegistry(), this.state.getSubstrateApiMap(), this.state.getEvmApiMap(), currentAddress);

    if (currentAddress) {
      this.subscribeBalancesAndCrowdloans(currentAddress, this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap(), this.state.getEvmApiMap());
    }

    this.eventHandler = (events, eventTypes) => {
      const serviceInfo = this.state.getServiceInfo();
      const needReload = eventTypes.some((eventType) => COMMON_RELOAD_EVENTS.includes(eventType));

      if (!needReload) {
        return;
      }

      const address = serviceInfo.currentAccountInfo?.address;

      // @ts-ignore
      this.subscribeYieldPools(serviceInfo.chainInfoMap, serviceInfo.assetRegistry, serviceInfo.chainApiMap.substrate, address);

      if (!address) {
        return;
      }

      this.subscribeBalancesAndCrowdloans(address, serviceInfo.chainInfoMap, serviceInfo.chainStateMap, serviceInfo.chainApiMap.substrate, serviceInfo.chainApiMap.evm);
    };

    this.state.eventService.onLazy(this.eventHandler);
  }

  async stop () {
    if (this.eventHandler) {
      this.state.eventService.offLazy(this.eventHandler);
      this.eventHandler = undefined;
    }

    this.stopAllSubscription();

    return Promise.resolve();
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

  subscribeYieldPools (chainInfoMap: Record<string, _ChainInfo>, assetInfoMap: Record<string, _ChainAsset>, substrateApiMap: Record<string, SubstrateApi>, evmApiMap: Record<string, _EvmApi>, address?: string, onlyRunOnFirstTime?: boolean) {
    this.updateSubscription('yieldPoolStats', this.initYieldPoolStatsSubscription(substrateApiMap, onlyRunOnFirstTime));

    if (address) {
      this.state.handleSwitchAccount(address).then(() => {
        const addresses = this.state.getDecodedAddresses(address);

        if (!addresses.length) {
          return;
        }

        this.updateSubscription('yieldPosition', this.initYieldPositionSubscription(addresses, substrateApiMap, evmApiMap, chainInfoMap, assetInfoMap));
      }).catch((e) => this.logger.warn(e));
    }
  }

  initYieldPositionSubscription (addresses: string[], substrateApiMap: Record<string, SubstrateApi>, evmApiMap: Record<string, _EvmApi>, chainInfoMap: Record<string, _ChainInfo>, assetInfoMap: Record<string, _ChainAsset>, onlyRunOnFirstTime?: boolean) {
    const updateYieldPoolStats = (data: YieldPositionInfo) => {
      this.state.updateYieldPosition(data);
    };

    const unsub = subscribeYieldPosition(substrateApiMap, evmApiMap, addresses, chainInfoMap, assetInfoMap, updateYieldPoolStats);

    if (onlyRunOnFirstTime) {
      unsub && unsub();

      return;
    }

    return () => {
      unsub && unsub();
    };
  }

  initYieldPoolStatsSubscription (substrateApiMap: Record<string, _SubstrateApi>, onlyRunOnFirstTime?: boolean) {
    this.state.resetYieldPoolInfo(Object.keys(this.state.getActiveChainInfoMap()));

    const updateYieldPoolStats = (data: YieldPoolInfo) => {
      this.state.updateYieldPoolInfo(data);
    };

    const unsub = subscribeYieldPoolStats(substrateApiMap, this.state.getActiveChainInfoMap(), this.state.getAssetRegistry(), updateYieldPoolStats);

    if (onlyRunOnFirstTime) {
      unsub && unsub();

      return;
    }

    return () => {
      unsub && unsub();
    };
  }

  subscribeStakingOnChain (address: string, substrateApiMap: Record<string, _SubstrateApi>, onlyRunOnFirstTime?: boolean) {
    this.state.resetStaking(address);
    const addresses = this.state.getDecodedAddresses(address);

    if (!addresses.length) {
      return;
    }

    this.updateSubscription('stakingOnChain', this.initStakingOnChainSubscription(addresses, substrateApiMap, onlyRunOnFirstTime));
    this.updateSubscription('essentialChainStakingMetadata', this.initEssentialChainStakingMetadataSubscription(substrateApiMap, onlyRunOnFirstTime)); // TODO: might not need to re-subscribe on changing account
  }

  initStakingOnChainSubscription (addresses: string[], substrateApiMap: Record<string, _SubstrateApi>, onlyRunOnFirstTime?: boolean) {
    const stakingCallback = (networkKey: string, rs: StakingItem) => {
      this.state.setStakingItem(networkKey, rs);
    };

    const nominatorStateCallback = (nominatorMetadata: NominatorMetadata) => {
      this.state.updateStakingNominatorMetadata(nominatorMetadata);
    };

    const unsub = stakingOnChainApi(addresses, substrateApiMap, this.state.getActiveChainInfoMap(), stakingCallback, nominatorStateCallback);

    if (onlyRunOnFirstTime) {
      unsub && unsub();

      return;
    }

    return () => {
      unsub && unsub();
    };
  }

  initEssentialChainStakingMetadataSubscription (substrateApiMap: Record<string, _SubstrateApi>, onlyRunOnFirstTime?: boolean) {
    const unsub = subscribeEssentialChainStakingMetadata(substrateApiMap, this.state.getActiveChainInfoMap(), (networkKey, rs) => {
      this.state.updateChainStakingMetadata(rs, {
        era: rs.era,
        minStake: rs.minStake,
        maxValidatorPerNominator: rs.maxValidatorPerNominator, // temporary fix for Astar, there's no limit for now
        maxWithdrawalRequestPerValidator: rs.maxWithdrawalRequestPerValidator, // by default
        allowCancelUnstaking: rs.allowCancelUnstaking,
        unstakingPeriod: rs.unstakingPeriod,
        expectedReturn: rs.expectedReturn,
        inflation: rs.inflation
      });
    });

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
    }, this.state.getChainInfoMap());

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

  async subscribeStakingRewardFastInterval (address: string) {
    const addresses = this.state.getDecodedAddresses(address);

    if (!addresses.length) {
      return;
    }

    const pooledStakingItems = await this.state.getPooledPositionByAddress(addresses);

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

    const updateState = (result: StakingRewardItem) => {
      this.state.updateStakingReward(result);
    };

    await Promise.all([
      getPoolingStakingRewardData(pooledAddresses, targetChainMap, this.state.getSubstrateApiMap(), updateState),
      getAmplitudeUnclaimedStakingReward(this.state.getSubstrateApiMap(), addresses, chainInfoMap, activeNetworks, updateState)
    ]);
  }

  async reloadStaking () {
    // const currentAddress = this.state.keyringService.currentAccount?.address;

    // this.subscribeYieldPools(this.state.getSubstrateApiMap());

    await waitTimeout(1800);
  }
}
