// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ApiMap, NftTransferExtra, ServiceInfo } from '@subwallet/extension-base/background/KoniTypes';
import { CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, CRON_GET_API_MAP_STATUS, CRON_REFRESH_CHAIN_NOMINATOR_METADATA, CRON_REFRESH_CHAIN_STAKING_METADATA, CRON_REFRESH_NFT_INTERVAL, CRON_REFRESH_PRICE_INTERVAL, CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL, CRON_REFRESH_STAKING_REWARD_INTERVAL } from '@subwallet/extension-base/constants';
import { getTokenPrice } from '@subwallet/extension-base/koni/api/coingecko';
import { KoniSubscription } from '@subwallet/extension-base/koni/background/subscription';
import { _ChainConnectionStatus, _ChainState, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
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
    this.state.getCurrentAccount((currentAccountInfo) => {
      if (!currentAccountInfo?.address) {
        return;
      }

      if (Object.keys(this.state.getSubstrateApiMap()).length !== 0 || Object.keys(this.state.getEvmApiMap()).length !== 0) {
        this.refreshPrice();
        this.updateApiMapStatus();
        this.refreshNft(currentAccountInfo.address, this.state.getApiMap(), this.state.getSmartContractNfts(), this.state.getActiveChainInfoMap());
        this.refreshStakingReward(currentAccountInfo.address);
        this.refreshStakingRewardFastInterval(currentAccountInfo.address);
        this.updateChainStakingMetadata(this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap());
        this.updateNominatorMetadata(currentAccountInfo.address, this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap());
      } else {
        this.setStakingRewardReady();
      }
    });
  };

  start = () => {
    if (this.status === 'running') {
      return;
    }

    this.logger.log('Starting cron jobs');
    this.state.getCurrentAccount((currentAccountInfo) => {
      if (!currentAccountInfo?.address) {
        return;
      }

      if (Object.keys(this.state.getSubstrateApiMap()).length !== 0 || Object.keys(this.state.getEvmApiMap()).length !== 0) {
        this.resetNft(currentAccountInfo.address);
        this.addCron('refreshPrice', this.refreshPrice, CRON_REFRESH_PRICE_INTERVAL);
        this.addCron('refreshNft', this.refreshNft(currentAccountInfo.address, this.state.getApiMap(), this.state.getSmartContractNfts(), this.state.getActiveChainInfoMap()), CRON_REFRESH_NFT_INTERVAL);
        this.addCron('checkStatusApiMap', this.updateApiMapStatus, CRON_GET_API_MAP_STATUS);
        this.addCron('recoverApiMap', this.recoverApiMap, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);
        this.addCron('refreshStakingReward', this.refreshStakingReward(currentAccountInfo.address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
        this.addCron('refreshPoolingStakingReward', this.refreshStakingRewardFastInterval(currentAccountInfo.address), CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL);
        this.addCron('updateChainStakingMetadata', this.updateChainStakingMetadata(this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap()), CRON_REFRESH_CHAIN_STAKING_METADATA);
        this.addCron('updateNominatorMetadata', this.updateNominatorMetadata(currentAccountInfo.address, this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap()), CRON_REFRESH_CHAIN_NOMINATOR_METADATA);
      } else {
        this.setStakingRewardReady();
      }
    });

    this.serviceSubscription = this.state.subscribeServiceInfo().subscribe({
      next: (serviceInfo) => {
        this.logger.log('ServiceInfo updated, restarting...');
        const address = serviceInfo.currentAccountInfo?.address;

        if (!address) {
          return;
        }

        this.resetStakingReward();
        this.resetNft(address);
        this.resetNftTransferMeta();
        this.removeCron('refreshNft');

        this.removeCron('refreshStakingReward');
        this.removeCron('refreshPoolingStakingReward');
        this.removeCron('refreshPrice');
        this.removeCron('checkStatusApiMap');
        this.removeCron('recoverApiMap');
        this.removeCron('updateChainStakingMetadata');
        this.removeCron('updateNominatorMetadata');

        if (this.checkNetworkAvailable(serviceInfo)) { // only add cron job if there's at least 1 active network
          this.addCron('refreshNft', this.refreshNft(address, serviceInfo.chainApiMap, this.state.getSmartContractNfts(), this.state.getActiveChainInfoMap()), CRON_REFRESH_NFT_INTERVAL);
          this.addCron('refreshPrice', this.refreshPrice, CRON_REFRESH_PRICE_INTERVAL);
          this.addCron('checkStatusApiMap', this.updateApiMapStatus, CRON_GET_API_MAP_STATUS);
          this.addCron('recoverApiMap', this.recoverApiMap, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);
          this.addCron('refreshStakingReward', this.refreshStakingReward(address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
          this.addCron('refreshPoolingStakingReward', this.refreshStakingRewardFastInterval(address), CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL);
          this.addCron('updateChainStakingMetadata', this.updateChainStakingMetadata(serviceInfo.chainInfoMap, serviceInfo.chainStateMap, serviceInfo.chainApiMap.substrate), CRON_REFRESH_CHAIN_STAKING_METADATA);
          this.addCron('updateNominatorMetadata', this.updateNominatorMetadata(address, serviceInfo.chainInfoMap, serviceInfo.chainStateMap, serviceInfo.chainApiMap.substrate), CRON_REFRESH_CHAIN_NOMINATOR_METADATA);
        } else {
          this.setStakingRewardReady();
        }
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

    this.state.getCurrentAccount(({ address }) => {
      this.subscriptions?.subscribeBalancesAndCrowdloans && this.subscriptions.subscribeBalancesAndCrowdloans(address, this.state.getChainInfoMap(), this.state.getChainStateMap(), this.state.getSubstrateApiMap(), this.state.getEvmApiMap());
    });
  };

  updateApiMapStatus = () => {
    const apiMap = this.state.getApiMap();
    const chainStateMap = this.state.getChainStateMap();

    for (const [key, substrateApi] of Object.entries(apiMap.substrate)) {
      let status: _ChainConnectionStatus = _ChainConnectionStatus.CONNECTING;

      if (substrateApi.isApiConnected) {
        status = _ChainConnectionStatus.CONNECTED;
      }

      if (!chainStateMap[key].connectionStatus) {
        this.state.updateNetworkStatus(key, status);
      } else if (chainStateMap[key].connectionStatus && chainStateMap[key].connectionStatus !== status) {
        this.state.updateNetworkStatus(key, status);
      }
    }

    for (const [key, evmApi] of Object.entries(apiMap.evm)) {
      evmApi.api.eth.net.isListening()
        .then(() => {
          if (!chainStateMap[key].connectionStatus) {
            this.state.updateNetworkStatus(key, _ChainConnectionStatus.CONNECTED);
          } else if (chainStateMap[key].connectionStatus && chainStateMap[key].connectionStatus !== _ChainConnectionStatus.CONNECTED) {
            this.state.updateNetworkStatus(key, _ChainConnectionStatus.CONNECTED);
          }
        })
        .catch(() => {
          if (!chainStateMap[key].connectionStatus) {
            this.state.updateNetworkStatus(key, _ChainConnectionStatus.CONNECTING);
          } else if (chainStateMap[key].connectionStatus && chainStateMap[key].connectionStatus !== _ChainConnectionStatus.CONNECTING) {
            this.state.updateNetworkStatus(key, _ChainConnectionStatus.CONNECTING);
          }
        });
    }
  };

  refreshPrice = () => {
    // Update for tokens price
    getTokenPrice(this.state.getAllPriceIds())
      .then((rs) => {
        this.state.setPrice(rs, () => {
          this.logger.log('Get Token Price From CoinGecko');
        });
      })
      .catch((err) => this.logger.log(err));
  };

  refreshNft = (address: string, apiMap: ApiMap, smartContractNfts: _ChainAsset[], chainInfoMap: Record<string, _ChainInfo>) => {
    return () => {
      this.logger.log('Refresh Nft state');
      this.subscriptions.subscribeNft(address, apiMap.substrate, apiMap.evm, smartContractNfts, chainInfoMap);
    };
  };

  resetNft = (newAddress: string) => {
    this.logger.log('Reset Nft state');
    this.state.resetNft(newAddress).catch((e) => this.logger.warn(e));
  };

  resetStakingReward = () => {
    this.logger.log('Reset Staking Reward State');
    this.state.resetStakingReward();
  };

  resetNftTransferMeta = () => {
    this.state.setNftTransfer({
      cronUpdate: false,
      forceUpdate: false
    } as NftTransferExtra);
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
