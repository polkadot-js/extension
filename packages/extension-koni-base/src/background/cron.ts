// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiMap, ApiProps, CustomToken, NETWORK_STATUS, NetworkJson, NftTransferExtra, ServiceInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getTokenPrice } from '@subwallet/extension-koni-base/api/coingecko';
import { fetchMultiChainHistories } from '@subwallet/extension-koni-base/api/subsquid/subsquid-multi-chain-history';
import { KoniSubscription } from '@subwallet/extension-koni-base/background/subscription';
import { ALL_ACCOUNT_KEY, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, CRON_GET_API_MAP_STATUS, CRON_REFRESH_HISTORY_INTERVAL, CRON_REFRESH_NFT_INTERVAL, CRON_REFRESH_PRICE_INTERVAL, CRON_REFRESH_STAKE_UNLOCKING_INFO, CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL, CRON_REFRESH_STAKING_REWARD_INTERVAL } from '@subwallet/extension-koni-base/constants';
import { Subject, Subscription } from 'rxjs';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

import DatabaseService from '../services/DatabaseService';
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

      if (Object.keys(this.state.getDotSamaApiMap()).length !== 0 || Object.keys(this.state.getWeb3ApiMap()).length !== 0) {
        this.refreshPrice();
        this.updateApiMapStatus();
        this.refreshNft(currentAccountInfo.address, this.state.getApiMap(), this.state.getActiveNftContracts(), this.state.getActiveContractSupportedNetworks());
        this.refreshStakingReward(currentAccountInfo.address);
        this.refreshStakingRewardFastInterval(currentAccountInfo.address);
        this.resetHistory(currentAccountInfo.address).then(() => {
          this.refreshHistory2(currentAccountInfo.address);
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

    this.logger.log('Stating cron jobs');
    this.state.getCurrentAccount((currentAccountInfo) => {
      if (!currentAccountInfo?.address) {
        return;
      }

      if (Object.keys(this.state.getDotSamaApiMap()).length !== 0 || Object.keys(this.state.getWeb3ApiMap()).length !== 0) {
        this.resetNft(currentAccountInfo.address);
        this.addCron('refreshNft', this.refreshNft(currentAccountInfo.address, this.state.getApiMap(), this.state.getActiveNftContracts(), this.state.getActiveContractSupportedNetworks()), CRON_REFRESH_NFT_INTERVAL);
        this.addCron('refreshPrice', this.refreshPrice, CRON_REFRESH_PRICE_INTERVAL);
        this.addCron('checkStatusApiMap', this.updateApiMapStatus, CRON_GET_API_MAP_STATUS);
        this.addCron('recoverApiMap', this.recoverApiMap, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);
        this.addCron('refreshStakingReward', this.refreshStakingReward(currentAccountInfo.address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
        this.addCron('refreshPoolingStakingReward', this.refreshStakingRewardFastInterval(currentAccountInfo.address), CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL);
        this.addCron('refreshStakeUnlockingInfo', this.refreshStakeUnlockingInfo(currentAccountInfo.address, this.state.getNetworkMap(), this.state.getDotSamaApiMap()), CRON_REFRESH_STAKE_UNLOCKING_INFO);

        this.resetHistory(currentAccountInfo.address).then(() => {
          this.addCron('refreshHistory', this.refreshHistory2(currentAccountInfo.address), CRON_REFRESH_HISTORY_INTERVAL);
        }).catch((err) => this.logger.warn(err));
      } else {
        // this.setNftReady(currentAccountInfo.address);
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

        // this.resetStakingReward(address);
        this.resetHistory(address).then(() => {
          this.removeCron('refreshHistory');

          if (this.checkNetworkAvailable(serviceInfo)) { // only add cron job if there's at least 1 active network
            this.addCron('refreshHistory', this.refreshHistory2(address), CRON_REFRESH_HISTORY_INTERVAL);
          }
        }).catch((err) => this.logger.warn(err));

        this.removeCron('refreshStakeUnlockingInfo');
        this.removeCron('refreshStakingReward');
        this.removeCron('refreshPoolingStakingReward');
        this.removeCron('refreshPrice');
        this.removeCron('checkStatusApiMap');
        this.removeCron('recoverApiMap');

        if (this.checkNetworkAvailable(serviceInfo)) { // only add cron job if there's at least 1 active network
          this.addCron('refreshNft', this.refreshNft(address, serviceInfo.apiMap, serviceInfo.customNftRegistry, this.getActiveContractSupportedNetworks(serviceInfo.networkMap)), CRON_REFRESH_NFT_INTERVAL);
          this.addCron('refreshPrice', this.refreshPrice, CRON_REFRESH_PRICE_INTERVAL);
          this.addCron('checkStatusApiMap', this.updateApiMapStatus, CRON_GET_API_MAP_STATUS);
          this.addCron('recoverApiMap', this.recoverApiMap, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);
          this.addCron('refreshStakingReward', this.refreshStakingReward(address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
          this.addCron('refreshPoolingStakingReward', this.refreshStakingRewardFastInterval(address), CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL);
          this.addCron('refreshStakeUnlockingInfo', this.refreshStakeUnlockingInfo(address, serviceInfo.networkMap, serviceInfo.apiMap.dotSama), CRON_REFRESH_STAKE_UNLOCKING_INFO);
        } else {
          // this.setNftReady(address);
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

    for (const apiProp of Object.values(apiMap.dotSama)) {
      if (!apiProp.isApiConnected) {
        apiProp.recoverConnect && apiProp.recoverConnect();
      }
    }

    for (const [key, web3] of Object.entries(apiMap.web3)) {
      web3.eth.net.isListening()
        .catch(() => {
          this.state.refreshWeb3Api(key);
        });
    }

    this.state.getCurrentAccount(({ address }) => {
      this.subscriptions?.subscribeBalancesAndCrowdloans && this.subscriptions.subscribeBalancesAndCrowdloans(address, this.state.getDotSamaApiMap(), this.state.getWeb3ApiMap());
    });
  };

  updateApiMapStatus = () => {
    const apiMap = this.state.getApiMap();
    const networkMap = this.state.getNetworkMap();

    for (const [key, apiProp] of Object.entries(apiMap.dotSama)) {
      if (apiProp.isEthereumOnly) {
        continue;
      }

      let status: NETWORK_STATUS = NETWORK_STATUS.CONNECTING;

      if (apiProp.isApiConnected) {
        status = NETWORK_STATUS.CONNECTED;
      }

      if (!networkMap[key].apiStatus) {
        this.state.updateNetworkStatus(key, status);
      } else if (networkMap[key].apiStatus && networkMap[key].apiStatus !== status) {
        this.state.updateNetworkStatus(key, status);
      }
    }

    for (const [key, web3] of Object.entries(apiMap.web3)) {
      web3.eth.net.isListening()
        .then(() => {
          if (!networkMap[key].apiStatus) {
            this.state.updateNetworkStatus(key, NETWORK_STATUS.CONNECTED);
          } else if (networkMap[key].apiStatus && networkMap[key].apiStatus !== NETWORK_STATUS.CONNECTED) {
            this.state.updateNetworkStatus(key, NETWORK_STATUS.CONNECTED);
          }
        })
        .catch(() => {
          if (!networkMap[key].apiStatus) {
            this.state.updateNetworkStatus(key, NETWORK_STATUS.CONNECTING);
          } else if (networkMap[key].apiStatus && networkMap[key].apiStatus !== NETWORK_STATUS.CONNECTING) {
            this.state.updateNetworkStatus(key, NETWORK_STATUS.CONNECTING);
          }
        });
    }
  };

  refreshPrice = () => {
    // Update for tokens price
    const coinGeckoKeys = Object.values(this.state.getNetworkMap()).map((network) => network.coinGeckoKey).filter((key) => key) as string[];

    getTokenPrice(coinGeckoKeys)
      .then((rs) => {
        this.state.setPrice(rs, () => {
          this.logger.log('Get Token Price From CoinGecko');
        });
      })
      .catch((err) => this.logger.log(err));
  };

  refreshNft = (address: string, apiMap: ApiMap, customNftRegistry: CustomToken[], contractSupportedNetworkMap: Record<string, NetworkJson>) => {
    return () => {
      this.logger.log('Refresh Nft state');
      this.subscriptions.subscribeNft(address, apiMap.dotSama, apiMap.web3, customNftRegistry, contractSupportedNetworkMap);
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

  // refreshHistory = (address: string, networkMap: Record<string, NetworkJson>) => {
  //   return () => {
  //     this.logger.log('Refresh History state');
  //     fetchDotSamaHistory(address, networkMap, (network, historyMap) => {
  //       this.logger.log(`[${network}] historyMap: `, historyMap);
  //       this.state.setHistory(address, network, historyMap);
  //     });
  //   };
  // };

  refreshHistory2 = (currentAddress: string) => {
    return () => {
      const addresses = currentAddress === ALL_ACCOUNT_KEY ? [currentAddress] : Object.values(this.state.getAllAddresses());

      this.logger.log('Refresh History state');
      fetchMultiChainHistories(addresses).then((historiesMap) => {
        Object.entries(historiesMap).forEach(([address, data]) => {
          data.forEach((item) => {
            this.state.setHistory(address, item.networkKey, item);
          });
        });
      }).catch((err) => this.logger.warn(err));
    };
  };

  refreshStakeUnlockingInfo (address: string, networkMap: Record<string, NetworkJson>, dotSamaApiMap: Record<string, ApiProps>) {
    return () => {
      if (address.toLowerCase() !== ALL_ACCOUNT_KEY) {
        this.subscriptions.subscribeStakeUnlockingInfo(address, networkMap, dotSamaApiMap)
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
    return Object.keys(serviceInfo.apiMap.dotSama).length > 0 || Object.keys(serviceInfo.apiMap.web3).length > 0;
  };

  getActiveContractSupportedNetworks = (networkMap: Record<string, NetworkJson>): Record<string, NetworkJson> => {
    const contractSupportedNetworkMap: Record<string, NetworkJson> = {};

    Object.entries(networkMap).forEach(([key, network]) => {
      if (network.active && network.supportSmartContract && network.supportSmartContract.length > 0) {
        contractSupportedNetworkMap[key] = network;
      }
    });

    return contractSupportedNetworkMap;
  };
}
