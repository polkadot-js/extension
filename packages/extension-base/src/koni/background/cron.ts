// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ApiMap, ServiceInfo } from '@subwallet/extension-base/background/KoniTypes';
import { CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, CRON_REFRESH_CHAIN_NOMINATOR_METADATA, CRON_REFRESH_CHAIN_STAKING_METADATA, CRON_REFRESH_NFT_INTERVAL, CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL, CRON_REFRESH_STAKING_REWARD_INTERVAL } from '@subwallet/extension-base/constants';
import { KoniSubscription } from '@subwallet/extension-base/koni/background/subscription';
import { _ChainState, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { EventType } from '@subwallet/extension-base/services/event-service/types';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
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

  init = () => {
    const currentAccountInfo = this.state.keyringService.currentAccount;

    if (!currentAccountInfo?.address) {
      return;
    }

    if (Object.keys(this.state.getSubstrateApiMap()).length !== 0 || Object.keys(this.state.getEvmApiMap()).length !== 0) {
      this.refreshNft(currentAccountInfo.address, this.state.getApiMap(), this.state.getSmartContractNfts(), this.state.getActiveChainInfoMap());
      this.refreshStakingReward(currentAccountInfo.address);
      this.refreshStakingRewardFastInterval(currentAccountInfo.address);
      this.updateChainStakingMetadata(this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap());
      this.updateNominatorMetadata(currentAccountInfo.address, this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap());
    } else {
      this.setStakingRewardReady();
    }
  };

  start = () => {
    if (this.status === 'running') {
      return;
    }

    this.logger.log('Starting cron jobs');
    const currentAccountInfo = this.state.keyringService.currentAccount;

    if (!currentAccountInfo?.address) {
      return;
    }

    if (Object.keys(this.state.getSubstrateApiMap()).length !== 0 || Object.keys(this.state.getEvmApiMap()).length !== 0) {
      this.resetNft(currentAccountInfo.address);
      this.addCron('refreshNft', this.refreshNft(currentAccountInfo.address, this.state.getApiMap(), this.state.getSmartContractNfts(), this.state.getActiveChainInfoMap()), CRON_REFRESH_NFT_INTERVAL);
      this.addCron('recoverApiMap', this.recoverApiMap, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);
      this.addCron('refreshStakingReward', this.refreshStakingReward(currentAccountInfo.address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
      this.addCron('refreshPoolingStakingReward', this.refreshStakingRewardFastInterval(currentAccountInfo.address), CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL);
      this.addCron('updateChainStakingMetadata', this.updateChainStakingMetadata(this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap()), CRON_REFRESH_CHAIN_STAKING_METADATA);
      this.addCron('updateNominatorMetadata', this.updateNominatorMetadata(currentAccountInfo.address, this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap()), CRON_REFRESH_CHAIN_NOMINATOR_METADATA);
    } else {
      this.setStakingRewardReady();
    }

    const reloadEvents: EventType[] = ['account.add', 'account.remove', 'account.updateCurrent', 'chain.add', 'chain.updateState', 'asset.updateState', 'transaction.done', 'transaction.failed'];

    this.state.eventService.onLazy((events, eventTypes) => {
      const serviceInfo = this.state.getServiceInfo();
      const needReload = eventTypes.some((eT) => reloadEvents.includes(eT));
      const chainUpdated = eventTypes.includes('chain.updateState');

      if (!needReload) {
        return;
      }

      this.logger.log('ServiceInfo updated, restarting...');
      const address = serviceInfo.currentAccountInfo?.address;

      if (!address) {
        return;
      }

      this.resetStakingReward();
      this.resetNft(address);
      this.removeCron('refreshNft');

      this.removeCron('refreshStakingReward');
      this.removeCron('refreshPoolingStakingReward');
      this.removeCron('checkStatusApiMap');
      this.removeCron('recoverApiMap');
      chainUpdated && this.removeCron('updateChainStakingMetadata');
      this.removeCron('updateNominatorMetadata');

      if (this.checkNetworkAvailable(serviceInfo)) { // only add cron job if there's at least 1 active network
        this.addCron('refreshNft', this.refreshNft(address, serviceInfo.chainApiMap, this.state.getSmartContractNfts(), this.state.getActiveChainInfoMap()), CRON_REFRESH_NFT_INTERVAL);
        this.addCron('recoverApiMap', this.recoverApiMap, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);
        this.addCron('refreshStakingReward', this.refreshStakingReward(address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
        this.addCron('refreshPoolingStakingReward', this.refreshStakingRewardFastInterval(address), CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL);
        chainUpdated && this.addCron('updateChainStakingMetadata', this.updateChainStakingMetadata(serviceInfo.chainInfoMap, serviceInfo.chainStateMap, serviceInfo.chainApiMap.substrate), CRON_REFRESH_CHAIN_STAKING_METADATA);
        this.addCron('updateNominatorMetadata', this.updateNominatorMetadata(address, serviceInfo.chainInfoMap, serviceInfo.chainStateMap, serviceInfo.chainApiMap.substrate), CRON_REFRESH_CHAIN_NOMINATOR_METADATA);
      } else {
        this.setStakingRewardReady();
      }
    });

    this.status = 'running';
  };

  stop = () => {
    if (this.status === 'stopped') {
      return;
    }

    if (this.serviceSubscription) {
      this.serviceSubscription.unsubscribe();
      this.serviceSubscription = undefined;
    }

    this.logger.log('Stopping cron jobs');
    this.removeAllCrons();

    this.status = 'stopped';
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
      this.logger.log('Refresh Nft state');
      this.subscriptions.subscribeNft(address, apiMap.substrate, apiMap.evm, smartContractNfts, chainInfoMap);
    };
  };

  resetNft = (newAddress: string) => {
    this.logger.log('Reset Nft state');
    this.state.resetNft(newAddress);
  };

  resetStakingReward = () => {
    this.logger.log('Reset Staking Reward State');
    this.state.resetStakingReward();
  };

  refreshStakingReward = (address: string) => {
    return () => {
      this.logger.log('Fetching staking reward data');
      this.subscriptions.subscribeStakingReward(address)
        .then(() => this.logger.log('Refresh staking reward state'))
        .catch(this.logger.error);
    };
  };

  refreshStakingRewardFastInterval = (address: string) => {
    return () => {
      this.logger.log('Fetching staking reward data with fast interval');
      this.subscriptions.subscribeStakingRewardFastInterval(address)
        .then(() => this.logger.log('Refresh staking reward state with fast interval'))
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
      this.logger.log('Fetching chain staking metadata');

      this.subscriptions.fetchChainStakingMetadata(chainInfoMap, chainStateMap, substrateApiMap)
        .then(() => this.logger.log('Updated chain staking metadata'))
        .catch(this.logger.error);
    };
  };

  updateNominatorMetadata = (address: string, chainInfoMap: Record<string, _ChainInfo>, chainStateMap: Record<string, _ChainState>, substrateApiMap: Record<string, _SubstrateApi>) => {
    return () => {
      this.logger.log('Fetching nominator data', address);

      this.subscriptions.fetchNominatorMetadata(address, chainInfoMap, chainStateMap, substrateApiMap)
        .then(() => this.logger.log('Updated nominator data', address))
        .catch(this.logger.error);
    };
  };
}
