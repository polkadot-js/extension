// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Subject } from 'rxjs';

import { ApiProps, NETWORK_STATUS, NftTransferExtra, StakingRewardJson } from '@polkadot/extension-base/background/KoniTypes';
import { getTokenPrice } from '@polkadot/extension-koni-base/api/coingecko';
import { fetchDotSamaHistory } from '@polkadot/extension-koni-base/api/subquery/history';
import { state } from '@polkadot/extension-koni-base/background/handlers';
import { KoniSubscription } from '@polkadot/extension-koni-base/background/subscription';
import { CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, CRON_GET_API_MAP_STATUS, CRON_REFRESH_HISTORY_INTERVAL, CRON_REFRESH_NFT_INTERVAL, CRON_REFRESH_PRICE_INTERVAL, CRON_REFRESH_STAKING_REWARD_INTERVAL } from '@polkadot/extension-koni-base/constants';

export class KoniCron {
  subscriptions: KoniSubscription;

  constructor (subscriptions: KoniSubscription) {
    this.subscriptions = subscriptions;
  }

  private cronMap: Record<string, any> = {};
  private subjectMap: Record<string, Subject<any>> = {};

  getCron (name: string): any {
    return this.cronMap[name];
  }

  getSubjectMap (name: string): any {
    return this.subjectMap[name];
  }

  addCron (name: string, callback: (param?: any) => void, interval: number, runFirst = true) {
    if (runFirst) {
      callback();
    }

    this.cronMap[name] = setInterval(callback, interval);
  }

  addSubscribeCron<T> (name: string, callback: (subject: Subject<T>) => void, interval: number) {
    const sb = new Subject<T>();

    callback(sb);
    this.subjectMap[name] = sb;
    this.cronMap[name] = setInterval(callback, interval);
  }

  removeCron (name: string) {
    const interval = this.cronMap[name] as number;

    if (interval) {
      clearInterval(interval);
      delete this.cronMap[name];
    }
  }

  init () {
    this.addCron('refreshPrice', this.refreshPrice, CRON_REFRESH_PRICE_INTERVAL);
    this.addCron('checkStatusApiMap', this.updateApiMapStatus, CRON_GET_API_MAP_STATUS);
    this.addCron('recoverApiMap', this.recoverApiMap, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);
    state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo) {
        this.addCron('refreshNft', this.refreshNft(currentAccountInfo.address, state.getApiMap().dotSama), CRON_REFRESH_NFT_INTERVAL);
        this.addCron('refreshStakingReward', this.refreshStakingReward(currentAccountInfo.address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
        this.addCron('refreshHistory', this.refreshHistory(currentAccountInfo.address), CRON_REFRESH_HISTORY_INTERVAL);
      }

      state.subscribeServiceInfo().subscribe({
        next: (serviceInfo) => {
          const { address } = serviceInfo.currentAccountInfo;

          this.resetNft();
          this.resetNftTransferMeta();
          this.resetStakingReward();
          this.resetHistory();
          this.removeCron('refreshNft');
          this.removeCron('refreshStakingReward');
          this.removeCron('refreshHistory');

          this.addCron('refreshNft', this.refreshNft(address, serviceInfo.apiMap.dotSama), CRON_REFRESH_NFT_INTERVAL);
          this.addCron('refreshStakingReward', this.refreshStakingReward(address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
          this.addCron('refreshHistory', this.refreshHistory(address), CRON_REFRESH_HISTORY_INTERVAL);
        }
      });
    });
  }

  // deprecated
  // recoverAPI () {
  //   state.getCurrentAccount(({ address }) => {
  //     console.log('Auto recovering API');
  //     Object.values(dotSamaAPIMap).forEach((apiProp) => {
  //       if (apiProp.apiRetry && apiProp.apiRetry > DOTSAMA_MAX_CONTINUE_RETRY) {
  //         apiProp.recoverConnect && apiProp.recoverConnect();
  //       }
  //     });
  //
  //     this.subscriptions?.subscribeBalancesAndCrowdloans && this.subscriptions.subscribeBalancesAndCrowdloans(address, state.getApiMap().dotSama);
  //   });
  // }

  recoverApiMap () {
    const apiMap = state.getApiMap();

    for (const apiProp of Object.values(apiMap.dotSama)) {
      if (!apiProp.isApiConnected) {
        apiProp.recoverConnect && apiProp.recoverConnect();
      }
    }

    for (const [key, web3] of Object.entries(apiMap.web3)) {
      web3.eth.net.isListening()
        .catch(() => {
          state.refreshWeb3Api(key);
        });
    }

    state.getCurrentAccount(({ address }) => {
      this.subscriptions?.subscribeBalancesAndCrowdloans && this.subscriptions.subscribeBalancesAndCrowdloans(address, state.getApiMap().dotSama);
    });
  }

  updateApiMapStatus () {
    const apiMap = state.getApiMap();
    const networkMap = state.getNetworkMap();

    for (const [key, apiProp] of Object.entries(apiMap.dotSama)) {
      let status: NETWORK_STATUS = NETWORK_STATUS.CONNECTING;

      if (apiProp.isApiConnected) {
        status = NETWORK_STATUS.CONNECTED;
      }

      if (!networkMap[key].apiStatus) {
        state.updateNetworkStatus(key, status);
      } else if (networkMap[key].apiStatus && networkMap[key].apiStatus !== status) {
        state.updateNetworkStatus(key, status);
      }
    }

    for (const [key, web3] of Object.entries(apiMap.web3)) {
      web3.eth.net.isListening()
        .then(() => {
          if (!networkMap[key].apiStatus) {
            state.updateNetworkStatus(key, NETWORK_STATUS.CONNECTED);
          } else if (networkMap[key].apiStatus && networkMap[key].apiStatus !== NETWORK_STATUS.CONNECTED) {
            state.updateNetworkStatus(key, NETWORK_STATUS.CONNECTED);
          }
        })
        .catch(() => {
          if (!networkMap[key].apiStatus) {
            state.updateNetworkStatus(key, NETWORK_STATUS.CONNECTING);
          } else if (networkMap[key].apiStatus && networkMap[key].apiStatus !== NETWORK_STATUS.CONNECTING) {
            state.updateNetworkStatus(key, NETWORK_STATUS.CONNECTING);
          }
        });
    }
  }

  refreshPrice () {
    const activeNetworks: string[] = [];

    Object.values(state.getNetworkMap()).forEach((network) => {
      if (network.active && network.coinGeckoKey) {
        activeNetworks.push(network.coinGeckoKey);
      }
    });
    getTokenPrice(activeNetworks)
      .then((rs) => {
        state.setPrice(rs, () => {
          console.log('Get Token Price From CoinGecko');
        });
      })
      .catch((err) => console.log(err));
  }

  refreshNft (address: string, dotSamaApiMap: Record<string, ApiProps>) {
    return () => {
      console.log('Refresh Nft state');
      this.subscriptions.subscribeNft(address, dotSamaApiMap);
    };
  }

  resetNft () {
    state.resetNft();
    state.resetNftCollection();
    console.log('Reset Nft state');
  }

  resetNftTransferMeta () {
    state.setNftTransfer({
      cronUpdate: false,
      forceUpdate: false
    } as NftTransferExtra);
  }

  resetStakingReward () {
    state.resetStakingMap();
    state.setStakingReward({
      details: []
    } as StakingRewardJson);
    // console.log('Reset Staking reward state');
  }

  refreshStakingReward (address: string) {
    return () => {
      this.subscriptions.subscribeStakingReward(address)
        .then(() => console.log('Refresh staking reward state'))
        .catch(console.error);
    };
  }

  refreshHistory (address: string) {
    return () => {
      console.log('Refresh History state');
      fetchDotSamaHistory(address, (historyMap) => {
        console.log('--- historyMap ---', historyMap);
        state.setHistory(historyMap);
      });
    };
  }

  resetHistory () {
    state.setHistory({});
  }
}
