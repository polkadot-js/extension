// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain/types';
import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { ApiProps, CustomToken, NetworkJson, NftTransferExtra, StakingType, UnlockingStakeInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { CHAIN_TYPES, getUnlockingInfo } from '@subwallet/extension-koni-base/api/bonding';
import { subscribeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { subscribeCrowdloan } from '@subwallet/extension-koni-base/api/dotsama/crowdloan';
import { getNominationStakingRewardData, getPoolingStakingRewardData, stakingOnChainApi } from '@subwallet/extension-koni-base/api/staking';
import { getAmplitudeUnclaimedStakingReward } from '@subwallet/extension-koni-base/api/staking/paraChain';
import { nftHandler } from '@subwallet/extension-koni-base/background/handlers';
import { Subscription } from 'rxjs';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

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
    this.state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo) {
        const { address } = currentAccountInfo;

        this.subscribeBalancesAndCrowdloans(address, this.state.getSubstrateApiMap(), this.state.getEvmApiMap());
        this.subscribeStakingOnChain(address, this.state.getSubstrateApiMap());
      }
    });

    !this.serviceSubscription &&
      (this.serviceSubscription = this.state.subscribeServiceInfo().subscribe({
        next: (serviceInfo) => {
          const { address } = serviceInfo.currentAccountInfo;

          this.subscribeBalancesAndCrowdloans(address, serviceInfo.chainApiMap.substrate, serviceInfo.chainApiMap.evm);
          this.subscribeStakingOnChain(address, serviceInfo.chainApiMap.substrate);
        }
      }));
  }

  stop () {
    this.logger.log('Stopping subscription');

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

    this.state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo) {
        const { address } = currentAccountInfo;

        this.subscribeBalancesAndCrowdloans(address, this.state.getSubstrateApiMap(), this.state.getEvmApiMap(), true);
        this.subscribeStakingOnChain(address, this.state.getSubstrateApiMap(), true);
        // this.stopAllSubscription();
      }
    });
  }

  subscribeBalancesAndCrowdloans (address: string, substrateApiMap: Record<string, _SubstrateApi>, web3ApiMap: Record<string, _EvmApi>, onlyRunOnFirstTime?: boolean) {
    this.state.switchAccount(address).then(() => {
      this.state.getDecodedAddresses(address)
        .then((addresses) => {
          if (!addresses.length) {
            return;
          }

          this.updateSubscription('balance', this.initBalanceSubscription(address, addresses, substrateApiMap, web3ApiMap, onlyRunOnFirstTime));
          this.updateSubscription('crowdloan', this.initCrowdloanSubscription(addresses, substrateApiMap, onlyRunOnFirstTime));
        })
        .catch(this.logger.error);
    }).catch((err) => this.logger.warn(err));
  }

  subscribeStakingOnChain (address: string, dotSamaApiMap: Record<string, ApiProps>, onlyRunOnFirstTime?: boolean) {
    this.state.resetStaking(address).then(() => {
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

  initBalanceSubscription (key: string, addresses: string[], substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, onlyRunOnFirstTime?: boolean) {
    const unsub = subscribeBalance(addresses, substrateApiMap, evmApiMap, (networkKey, rs) => {
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

  initCrowdloanSubscription (addresses: string[], substrateApiMap: Record<string, _SubstrateApi>, onlyRunOnFirstTime?: boolean) {
    const subscriptionPromise = subscribeCrowdloan(addresses, substrateApiMap, (networkKey, rs) => {
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

  subscribeNft (address: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, customErc721Registry: CustomToken[], contractSupportedNetworkMap: Record<string, _ChainInfo>) {
    this.state.getDecodedAddresses(address)
      .then((addresses) => {
        if (!addresses.length) {
          return;
        }

        this.initNftSubscription(addresses, substrateApiMap, evmApiMap, customErc721Registry, contractSupportedNetworkMap);
      })
      .catch(this.logger.error);
  }

  initNftSubscription (addresses: string[], substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, customNftRegistry: CustomToken[], contractSupportedNetworkMap: Record<string, _ChainInfo>) {
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

      nftHandler.setContractSupportedNetworkMap(contractSupportedNetworkMap);
      nftHandler.setDotSamaApiMap(substrateApiMap);
      nftHandler.setWeb3ApiMap(evmApiMap);
      nftHandler.setAddresses(addresses);

      nftHandler.handleNfts(
        customNftRegistry,
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

    if (!addresses.length) {
      return;
    }

    const chainInfoMap = this.state.getChainInfoMap();
    const targetNetworkMap: Record<string, _ChainInfo> = {};

    Object.entries(chainInfoMap).forEach(([key, network]) => {
      const chainState = this.state.getChainStateByKey(key);

      if (chainState.active && network.substrateInfo?.supportStaking) {
        targetNetworkMap[key] = network;
      }
    });

    const result = await getNominationStakingRewardData(addresses, targetNetworkMap);

    this.state.updateStakingReward(result, 'slowInterval');
    this.logger.log('Set staking reward state done', result);
  }

  async subscribeStakingRewardFastInterval (address: string) {
    const addresses = await this.state.getDecodedAddresses(address);

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

      if (chainState.active && network.substrateInfo?.supportStaking) {
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
    this.logger.log('Set staking reward state with fast interval done', result);
  }

  async subscribeStakeUnlockingInfo (address: string, networkMap: Record<string, NetworkJson>, dotSamaApiMap: Record<string, ApiProps>) {
    const addresses = await this.state.getDecodedAddresses(address);
    const currentAddress = addresses[0]; // only get info for the current account

    const stakeUnlockingInfo: UnlockingStakeInfo[] = [];

    if (!addresses.length) {
      return;
    }

    const stakingItems = await this.state.getStakingRecordsByAddress(currentAddress); // only get records of active networks

    await Promise.all(stakingItems.map(async (stakingItem) => {
      const needUpdateUnlockingStake = parseFloat(stakingItem.balance as string) > 0 && stakingItem.type === StakingType.NOMINATED;
      const networkJson = networkMap[stakingItem.chain];

      if (needUpdateUnlockingStake) {
        let extraCollatorAddress;

        if (CHAIN_TYPES.amplitude.includes(stakingItem.chain)) {
          const extraDelegationInfo = await this.state.getExtraDelegationInfo(stakingItem.chain, stakingItem.address);

          if (extraDelegationInfo) {
            extraCollatorAddress = extraDelegationInfo.collatorAddress;
          }
        }

        const unlockingInfo = await getUnlockingInfo(dotSamaApiMap[stakingItem.chain], networkJson, stakingItem.chain, currentAddress, stakingItem.type, extraCollatorAddress);

        stakeUnlockingInfo.push(unlockingInfo);
      }
    }));

    this.state.setStakeUnlockingInfo({
      timestamp: +new Date(),
      details: stakeUnlockingInfo
    });
  }
}
