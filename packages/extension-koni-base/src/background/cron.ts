// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ApiMap, NftTransferExtra, ServiceInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, CRON_GET_API_MAP_STATUS, CRON_REFRESH_HISTORY_INTERVAL, CRON_REFRESH_NFT_INTERVAL, CRON_REFRESH_PRICE_INTERVAL, CRON_REFRESH_STAKE_UNLOCKING_INFO, CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL, CRON_REFRESH_STAKING_REWARD_INTERVAL } from '@subwallet/extension-base/constants';
import { _ChainConnectionStatus, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { getTokenPrice } from '@subwallet/extension-koni-base/api/coingecko';
import { fetchMultiChainHistories } from '@subwallet/extension-koni-base/api/subsquid/subsquid-multi-chain-history';
import { KoniSubscription } from '@subwallet/extension-koni-base/background/subscription';
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
        this.refreshStakeUnlockingInfo(currentAccountInfo.address, this.state.getChainInfoMap(), this.state.getSubstrateApiMap());
        this.resetHistory(currentAccountInfo.address).then(() => {
          this.refreshHistoryV2(currentAccountInfo.address);
        }).catch((err) => this.logger.warn(err));
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
        this.addCron('refreshStakeUnlockingInfo', this.refreshStakeUnlockingInfo(currentAccountInfo.address, this.state.getChainInfoMap(), this.state.getSubstrateApiMap()), CRON_REFRESH_STAKE_UNLOCKING_INFO);

        this.resetHistory(currentAccountInfo.address).then(() => {
          this.addCron('refreshHistory', this.refreshHistoryV2(currentAccountInfo.address), CRON_REFRESH_HISTORY_INTERVAL);
        }).catch((err) => this.logger.warn(err));
      } else {
        this.setStakingRewardReady();
      }
    });

    this.serviceSubscription = this.state.subscribeServiceInfo().subscribe({
      next: (serviceInfo) => {
        const { address } = serviceInfo.currentAccountInfo;

        this.resetStakingReward();
        this.resetNft(address);
        this.resetNftTransferMeta();
        this.removeCron('refreshNft');
        this.resetHistory(address).then(() => {
          this.removeCron('refreshHistory');

          if (this.checkNetworkAvailable(serviceInfo)) { // only add cron job if there's at least 1 active network
            this.addCron('refreshHistory', this.refreshHistoryV2(address), CRON_REFRESH_HISTORY_INTERVAL);
          }
        }).catch((err) => this.logger.warn(err));

        this.removeCron('refreshStakeUnlockingInfo');
        this.removeCron('refreshStakingReward');
        this.removeCron('refreshPoolingStakingReward');
        this.removeCron('refreshPrice');
        this.removeCron('checkStatusApiMap');
        this.removeCron('recoverApiMap');

        if (this.checkNetworkAvailable(serviceInfo)) { // only add cron job if there's at least 1 active network
          this.addCron('refreshNft', this.refreshNft(address, serviceInfo.chainApiMap, this.state.getSmartContractNfts(), this.state.getActiveChainInfoMap()), CRON_REFRESH_NFT_INTERVAL);
          this.addCron('refreshPrice', this.refreshPrice, CRON_REFRESH_PRICE_INTERVAL);
          this.addCron('checkStatusApiMap', this.updateApiMapStatus, CRON_GET_API_MAP_STATUS);
          this.addCron('recoverApiMap', this.recoverApiMap, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);
          this.addCron('refreshStakingReward', this.refreshStakingReward(address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
          this.addCron('refreshPoolingStakingReward', this.refreshStakingRewardFastInterval(address), CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL);
          this.addCron('refreshStakeUnlockingInfo', this.refreshStakeUnlockingInfo(address, serviceInfo.chainInfoMap, serviceInfo.chainApiMap.substrate), CRON_REFRESH_STAKE_UNLOCKING_INFO);
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
      this.subscriptions?.subscribeBalancesAndCrowdloans && this.subscriptions.subscribeBalancesAndCrowdloans(address, this.state.getChainInfoMap(), this.state.getSubstrateApiMap(), this.state.getEvmApiMap());
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

  refreshHistoryV2 = (currentAddress: string) => {
    return () => {
      const addresses = currentAddress !== ALL_ACCOUNT_KEY ? [currentAddress] : Object.values(this.state.getAllAddresses());

      this.logger.log('Refresh History state');
      fetchMultiChainHistories(addresses).then((historiesMap) => {
        Object.entries(historiesMap).forEach(([address, data]) => {
          data.forEach((item) => {
            // TODO: networkKey from indexer API might not be the same as in ChainService
            this.state.setHistory(address, item.networkKey, item);
          });
        });
      }).catch((err) => this.logger.warn(err));
    };
  };

  refreshStakeUnlockingInfo (address: string, networkMap: Record<string, _ChainInfo>, substrateApiMap: Record<string, _SubstrateApi>) {
    return () => {
      if (address.toLowerCase() !== ALL_ACCOUNT_KEY) {
        this.subscriptions.subscribeStakeUnlockingInfo(address, networkMap, substrateApiMap)
          .then(() => this.logger.log('Refresh staking unlocking info done'))
          .catch(this.logger.error);
      }
    };
  }

  setStakingRewardReady = () => {
    this.state.updateStakingRewardReady(true);
  };

  resetHistory = (address: string): Promise<void> => {
    return this.state.resetHistoryMap(address).catch((err) => this.logger.warn(err));
  };

  checkNetworkAvailable = (serviceInfo: ServiceInfo): boolean => {
    return Object.keys(serviceInfo.chainApiMap.substrate).length > 0 || Object.keys(serviceInfo.chainApiMap.evm).length > 0;
  };
}
