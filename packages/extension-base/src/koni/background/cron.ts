// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ApiMap, ServiceInfo } from '@subwallet/extension-base/background/KoniTypes';
import { CRON_REFRESH_CHAIN_STAKING_METADATA, CRON_REFRESH_NFT_INTERVAL, CRON_SYNC_MANTA_PAY } from '@subwallet/extension-base/constants';
import { KoniSubscription } from '@subwallet/extension-base/koni/background/subscription';
import { _isChainSupportEvmNft, _isChainSupportNativeNft, _isChainSupportWasmNft } from '@subwallet/extension-base/services/chain-service/utils';
import { EventItem, EventType } from '@subwallet/extension-base/services/event-service/types';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { waitTimeout } from '@subwallet/extension-base/utils';
import { Subject, Subscription } from 'rxjs';

import KoniState from './handlers/State';

export class KoniCron {
  subscriptions: KoniSubscription;
  public status: 'pending' | 'running' | 'stopped' = 'pending';
  private serviceSubscription: Subscription | undefined;
  public dbService: DatabaseService;
  private state: KoniState;

  constructor (state: KoniState, subscriptions: KoniSubscription, dbService: DatabaseService) {
    this.subscriptions = subscriptions;
    this.dbService = dbService;
    this.state = state;
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

  start = async () => {
    if (this.status === 'running') {
      return;
    }

    await Promise.all([this.state.eventService.waitKeyringReady, this.state.eventService.waitAssetReady]);

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
      const reloadMantaPay = eventTypes.includes('mantaPay.submitTransaction') || eventTypes.includes('mantaPay.enable');
      const updatedChains: string[] = [];

      if (chainUpdated) {
        events.forEach((event) => {
          if (event.type === 'chain.updateState') {
            const updatedData = event.data as [string];

            updatedChains.push(updatedData[0]);
          }
        });
      }

      if (!commonReload && !chainUpdated && !reloadMantaPay) {
        return;
      }

      const address = serviceInfo.currentAccountInfo?.address;

      if (!address) {
        return;
      }

      const chainInfoMap = serviceInfo.chainInfoMap;

      const needUpdateNft = this.needUpdateNft(chainInfoMap, updatedChains);

      // MantaPay
      reloadMantaPay && this.removeCron('syncMantaPay');
      commonReload && this.removeCron('refreshPoolingStakingReward');

      // NFT
      (commonReload || needUpdateNft) && this.resetNft(address);
      (commonReload || needUpdateNft) && this.removeCron('refreshNft');
      commonReload && this.removeCron('refreshPoolingStakingReward');

      if (chainUpdated) {
        this.stopPoolInfo();
        this.removeCron('fetchPoolInfo');
        this.addCron('fetchPoolInfo', this.fetchPoolInfo, CRON_REFRESH_CHAIN_STAKING_METADATA);
      }

      // Chains
      if (this.checkNetworkAvailable(serviceInfo)) { // only add cron jobs if there's at least 1 active network
        (commonReload || needUpdateNft) && this.addCron('refreshNft', this.refreshNft(address, serviceInfo.chainApiMap, this.state.getSmartContractNfts(), this.state.getActiveChainInfoMap()), CRON_REFRESH_NFT_INTERVAL);
        reloadMantaPay && this.addCron('syncMantaPay', this.syncMantaPay, CRON_SYNC_MANTA_PAY);
      }
    };

    this.state.eventService.onLazy(this.eventHandler);

    this.addCron('fetchPoolInfo', this.fetchPoolInfo, CRON_REFRESH_CHAIN_STAKING_METADATA);

    if (!currentAccountInfo?.address) {
      return;
    }

    if (Object.keys(this.state.getSubstrateApiMap()).length !== 0 || Object.keys(this.state.getEvmApiMap()).length !== 0) {
      this.resetNft(currentAccountInfo.address);
      this.addCron('refreshNft', this.refreshNft(currentAccountInfo.address, this.state.getApiMap(), this.state.getSmartContractNfts(), this.state.getActiveChainInfoMap()), CRON_REFRESH_NFT_INTERVAL);
      // this.addCron('refreshStakingReward', this.refreshStakingReward(currentAccountInfo.address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
      this.addCron('syncMantaPay', this.syncMantaPay, CRON_SYNC_MANTA_PAY);
    }

    this.status = 'running';
  };

  stop = async () => {
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
    this.stopPoolInfo();

    this.status = 'stopped';

    return Promise.resolve();
  };

  syncMantaPay = () => {
    if (this.state.isMantaPayEnabled) {
      this.state.syncMantaPay().catch(console.warn);
    }
  };

  fetchPoolInfo = () => {
    this.state.earningService.runSubscribePoolsInfo().catch(console.error);
  };

  stopPoolInfo = () => {
    this.state.earningService.runUnsubscribePoolsInfo();
  };

  refreshNft = (address: string, apiMap: ApiMap, smartContractNfts: _ChainAsset[], chainInfoMap: Record<string, _ChainInfo>) => {
    return () => {
      this.subscriptions.subscribeNft(address, apiMap.substrate, apiMap.evm, smartContractNfts, chainInfoMap);
    };
  };

  resetNft = (newAddress: string) => {
    this.state.resetNft(newAddress);
  };

  checkNetworkAvailable = (serviceInfo: ServiceInfo): boolean => {
    return Object.keys(serviceInfo.chainApiMap.substrate).length > 0 || Object.keys(serviceInfo.chainApiMap.evm).length > 0;
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

    console.log('reload staking', address);

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
}
