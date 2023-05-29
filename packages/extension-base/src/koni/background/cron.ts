// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ApiMap, ServiceInfo } from '@subwallet/extension-base/background/KoniTypes';
import { CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, CRON_GET_API_MAP_STATUS, CRON_REFRESH_CHAIN_NOMINATOR_METADATA, CRON_REFRESH_CHAIN_STAKING_METADATA, CRON_REFRESH_NFT_INTERVAL, CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL, CRON_REFRESH_STAKING_REWARD_INTERVAL } from '@subwallet/extension-base/constants';
import { KoniSubscription } from '@subwallet/extension-base/koni/background/subscription';
import { _ChainConnectionStatus, _ChainState, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _isChainSupportEvmNft, _isChainSupportNativeNft, _isChainSupportSubstrateStaking, _isChainSupportWasmNft } from '@subwallet/extension-base/services/chain-service/utils';
import { EventItem, EventType } from '@subwallet/extension-base/services/event-service/types';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { waitTimeout } from '@subwallet/extension-base/utils';
import { Subject, Subscription } from 'rxjs';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

import KoniState from './handlers/State';

export class KoniCron {
  subscriptions: KoniSubscription;
  public status: 'pending' | 'running' | 'stopped' = 'pending';
  private serviceSubscription: Subscription | undefined;
  public dbService: DatabaseService;
  private state: KoniState;
  private logger: Logger;

  constructor (state: KoniState, subscriptions: KoniSubscription, dbService: DatabaseService) {
    this.subscriptions = subscriptions;
    this.dbService = dbService;
    this.state = state;
    this.logger = createLogger('Cron');
    // this.init();
  }

  private cronMap: Record<string, any> = {};
  private subjectMap: Record<string, Subject<any>> = {};
  private eventHandler?: ((events: EventItem<EventType>[], eventTypes: EventType[]) => void);

  getCron = (name: string): any => {
    return this.cronMap[name];
  };

  getSubjectMap = (name: string): any => {
    return this.subjectMap[name];
  };

  addCron = (name: string, callback: (param?: any) => void, interval: number, runFirst = true) => {
    if (runFirst) {
      callback();
    }

    this.cronMap[name] = setInterval(callback, interval);
  };

  addSubscribeCron = <T>(name: string, callback: (subject: Subject<T>) => void, interval: number) => {
    const sb = new Subject<T>();

    callback(sb);
    this.subjectMap[name] = sb;
    this.cronMap[name] = setInterval(callback, interval);
  };

  removeCron = (name: string) => {
    const interval = this.cronMap[name] as number;

    if (interval) {
      clearInterval(interval);
      delete this.cronMap[name];
    }
  };

  removeAllCrons = () => {
    Object.entries(this.cronMap).forEach(([key, interval]) => {
      clearInterval(interval as number);
      delete this.cronMap[key];
    });
  };

  // init = () => {
  //   const currentAccountInfo = this.state.keyringService.currentAccount;
  //
  //   if (!currentAccountInfo?.address) {
  //     return;
  //   }
  //
  //   if (Object.keys(this.state.getSubstrateApiMap()).length !== 0 || Object.keys(this.state.getEvmApiMap()).length !== 0) {
  //     this.refreshNft(currentAccountInfo.address, this.state.getApiMap(), this.state.getSmartContractNfts(), this.state.getActiveChainInfoMap());
  //     this.updateApiMapStatus();
  //     this.refreshStakingReward(currentAccountInfo.address);
  //     this.refreshStakingRewardFastInterval(currentAccountInfo.address);
  //     // this.updateChainStakingMetadata(this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap());
  //     this.updateNominatorMetadata(currentAccountInfo.address, this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap());
  //   } else {
  //     this.setStakingRewardReady();
  //   }
  // };

  start = () => {
    if (this.status === 'running') {
      return;
    }

    const currentAccountInfo = this.state.keyringService.currentAccount;

    const commonReloadEvents: EventType[] = [
      'account.add',
      'account.remove',
      'account.updateCurrent',
      'chain.add',
      'asset.updateState'
    ];

    this.eventHandler = (events, eventTypes) => {
      const serviceInfo = this.state.getServiceInfo();
      const commonReload = eventTypes.some((eventType) => commonReloadEvents.includes(eventType));

      const chainUpdated = eventTypes.includes('chain.updateState');
      const stakingSubmitted = eventTypes.includes('transaction.submitStaking');
      const updatedChains: string[] = [];

      if (chainUpdated) {
        events.forEach((event) => {
          if (event.type === 'chain.updateState') {
            const updatedData = event.data as [string];

            updatedChains.push(updatedData[0]);
          }
        });
      }

      if (!commonReload && !chainUpdated && !stakingSubmitted) {
        return;
      }

      const address = serviceInfo.currentAccountInfo?.address;

      if (!address) {
        return;
      }

      const chainInfoMap = serviceInfo.chainInfoMap;

      const needUpdateNft = this.needUpdateNft(chainInfoMap, updatedChains);
      const needUpdateStaking = this.needUpdateStaking(chainInfoMap, updatedChains);

      // NFT
      (commonReload || needUpdateNft) && this.resetNft(address);
      (commonReload || needUpdateNft) && this.removeCron('refreshNft');

      // Staking
      (commonReload || needUpdateStaking || stakingSubmitted) && this.resetStakingReward();
      (commonReload || needUpdateStaking || stakingSubmitted) && this.removeCron('refreshStakingReward');
      (commonReload || needUpdateStaking || stakingSubmitted) && this.removeCron('refreshPoolingStakingReward');
      (commonReload || needUpdateStaking || stakingSubmitted) && this.removeCron('updateNominatorMetadata');
      needUpdateStaking && this.removeCron('updateChainStakingMetadata');

      // Chains
      chainUpdated && this.removeCron('checkStatusApiMap');
      chainUpdated && this.removeCron('recoverApiMap');

      if (this.checkNetworkAvailable(serviceInfo)) { // only add cron job if there's at least 1 active network
        (commonReload || needUpdateNft) && this.addCron('refreshNft', this.refreshNft(address, serviceInfo.chainApiMap, this.state.getSmartContractNfts(), this.state.getActiveChainInfoMap()), CRON_REFRESH_NFT_INTERVAL);

        chainUpdated && this.addCron('checkStatusApiMap', this.updateApiMapStatus, CRON_GET_API_MAP_STATUS, false);
        chainUpdated && this.addCron('recoverApiMap', this.recoverApiMap, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);

        (commonReload || needUpdateStaking || stakingSubmitted) && this.addCron('refreshStakingReward', this.refreshStakingReward(address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
        (commonReload || needUpdateStaking || stakingSubmitted) && this.addCron('refreshPoolingStakingReward', this.refreshStakingRewardFastInterval(address), CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL);
        // (commonReload || needUpdateStaking || stakingSubmitted) && this.addCron('updateNominatorMetadata', this.updateNominatorMetadata(address, serviceInfo.chainInfoMap, serviceInfo.chainStateMap, serviceInfo.chainApiMap.substrate), CRON_REFRESH_CHAIN_NOMINATOR_METADATA);
        // needUpdateStaking && this.addCron('updateChainStakingMetadata', this.updateChainStakingMetadata(serviceInfo.chainInfoMap, serviceInfo.chainStateMap, serviceInfo.chainApiMap.substrate), CRON_REFRESH_CHAIN_STAKING_METADATA);
      } else {
        this.setStakingRewardReady();
      }
    };

    this.state.eventService.onLazy(this.eventHandler);

    if (!currentAccountInfo?.address) {
      return;
    }

    if (Object.keys(this.state.getSubstrateApiMap()).length !== 0 || Object.keys(this.state.getEvmApiMap()).length !== 0) {
      this.resetNft(currentAccountInfo.address);
      this.addCron('refreshNft', this.refreshNft(currentAccountInfo.address, this.state.getApiMap(), this.state.getSmartContractNfts(), this.state.getActiveChainInfoMap()), CRON_REFRESH_NFT_INTERVAL);
      this.addCron('checkStatusApiMap', this.updateApiMapStatus, CRON_GET_API_MAP_STATUS);
      this.addCron('recoverApiMap', this.recoverApiMap, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);
      this.addCron('refreshStakingReward', this.refreshStakingReward(currentAccountInfo.address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
      this.addCron('refreshPoolingStakingReward', this.refreshStakingRewardFastInterval(currentAccountInfo.address), CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL);
      // this.addCron('updateChainStakingMetadata', this.updateChainStakingMetadata(this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap()), CRON_REFRESH_CHAIN_STAKING_METADATA);
      // this.addCron('updateNominatorMetadata', this.updateNominatorMetadata(currentAccountInfo.address, this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap()), CRON_REFRESH_CHAIN_NOMINATOR_METADATA);
    } else {
      this.setStakingRewardReady();
    }

    this.status = 'running';
  };

  stop = () => {
    if (this.status === 'stopped') {
      return;
    }

    // Unsubscribe events
    if (this.eventHandler) {
      this.state.eventService.offLazy(this.eventHandler);
      this.eventHandler = undefined;
    }

    if (this.serviceSubscription) {
      this.serviceSubscription.unsubscribe();
      this.serviceSubscription = undefined;
    }

    this.removeAllCrons();

    this.status = 'stopped';
  };

  updateApiMapStatus = () => {
    this.state.chainService.updateApiMapStatus().catch(console.error);
  };

  recoverApiMap = () => {
    const apiMap = this.state.getApiMap();

    for (const [networkKey, apiProp] of Object.entries(apiMap.substrate)) {
      if (!apiProp.isApiConnected) {
        this.state.refreshSubstrateApi(networkKey);
      }
    }

    for (const [key, evmApi] of Object.entries(apiMap.evm)) {
      evmApi.api.eth.net.isListening()
        .catch(() => {
          this.state.refreshWeb3Api(key);
        });
    }

    const { address } = this.state.keyringService.currentAccount;

    this.subscriptions?.subscribeBalancesAndCrowdloans && this.subscriptions.subscribeBalancesAndCrowdloans(address, this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap(), this.state.getEvmApiMap());
  };

  refreshNft = (address: string, apiMap: ApiMap, smartContractNfts: _ChainAsset[], chainInfoMap: Record<string, _ChainInfo>) => {
    return () => {
      this.subscriptions.subscribeNft(address, apiMap.substrate, apiMap.evm, smartContractNfts, chainInfoMap);
    };
  };

  resetNft = (newAddress: string) => {
    this.state.resetNft(newAddress);
  };

  resetStakingReward = () => {
    this.state.resetStakingReward();
  };

  refreshStakingReward = (address: string) => {
    return () => {
      this.subscriptions.subscribeStakingReward(address)
        .catch(this.logger.error);
    };
  };

  refreshStakingRewardFastInterval = (address: string) => {
    return () => {
      this.subscriptions.subscribeStakingRewardFastInterval(address)
        .catch(this.logger.error);
    };
  };

  setStakingRewardReady = () => {
    this.state.updateStakingRewardReady(true);
  };

  checkNetworkAvailable = (serviceInfo: ServiceInfo): boolean => {
    return Object.keys(serviceInfo.chainApiMap.substrate).length > 0 || Object.keys(serviceInfo.chainApiMap.evm).length > 0;
  };

  updateChainStakingMetadata = (chainInfoMap: Record<string, _ChainInfo>, chainStateMap: Record<string, _ChainState>, substrateApiMap: Record<string, _SubstrateApi>) => {
    return () => {
      this.subscriptions.fetchChainStakingMetadata(chainInfoMap, chainStateMap, substrateApiMap)
        .catch(this.logger.error);
    };
  };

  updateNominatorMetadata = (address: string, chainInfoMap: Record<string, _ChainInfo>, chainStateMap: Record<string, _ChainState>, substrateApiMap: Record<string, _SubstrateApi>) => {
    return () => {
      this.subscriptions.fetchNominatorMetadata(address, chainInfoMap, chainStateMap, substrateApiMap)
        .catch(this.logger.error);
    };
  };

  public async reloadNft () {
    const address = this.state.keyringService.currentAccount.address;
    const serviceInfo = this.state.getServiceInfo();

    this.resetNft(address);
    this.removeCron('refreshNft');
    this.addCron('refreshNft', this.refreshNft(address, serviceInfo.chainApiMap, this.state.getSmartContractNfts(), this.state.getActiveChainInfoMap()), CRON_REFRESH_NFT_INTERVAL);

    await waitTimeout(1800);

    return true;
  }

  public async reloadStaking () {
    const address = this.state.keyringService.currentAccount.address;

    this.resetStakingReward();
    this.removeCron('refreshStakingReward');
    this.removeCron('refreshPoolingStakingReward');
    this.removeCron('updateNominatorMetadata');
    this.addCron('refreshStakingReward', this.refreshStakingReward(address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
    this.addCron('refreshPoolingStakingReward', this.refreshStakingRewardFastInterval(address), CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL);
    this.addCron('updateNominatorMetadata', this.updateNominatorMetadata(address, this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap()), CRON_REFRESH_CHAIN_NOMINATOR_METADATA);

    await waitTimeout(1800);

    return true;
  }

  private needUpdateNft (chainInfoMap: Record<string, _ChainInfo>, updatedChains?: string[]) {
    if (updatedChains && updatedChains.length > 0) {
      return updatedChains.some((updatedChain) => {
        const chainInfo = chainInfoMap[updatedChain];

        return (_isChainSupportNativeNft(chainInfo) || _isChainSupportEvmNft(chainInfo) || _isChainSupportWasmNft(chainInfo));
      });
    }

    return false;
  }

  private needUpdateStaking (chainInfoMap: Record<string, _ChainInfo>, updatedChains?: string[]) {
    if (updatedChains && updatedChains.length > 0) {
      return updatedChains.some((updatedChain) => _isChainSupportSubstrateStaking(chainInfoMap[updatedChain]));
    }

    return false;
  }
}
