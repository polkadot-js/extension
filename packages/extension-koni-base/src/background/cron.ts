// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiMap, CustomEvmToken, NETWORK_STATUS, NetworkJson, NftTransferExtra, StakingRewardJson } from '@subwallet/extension-base/background/KoniTypes';
import { getTokenPrice } from '@subwallet/extension-koni-base/api/coingecko';
import { fetchDotSamaHistory } from '@subwallet/extension-koni-base/api/subquery/history';
import { state } from '@subwallet/extension-koni-base/background/handlers';
import { KoniSubscription } from '@subwallet/extension-koni-base/background/subscription';
import { CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, CRON_GET_API_MAP_STATUS, CRON_REFRESH_HISTORY_INTERVAL, CRON_REFRESH_NFT_INTERVAL, CRON_REFRESH_PRICE_INTERVAL, CRON_REFRESH_STAKING_REWARD_INTERVAL } from '@subwallet/extension-koni-base/constants';
import { Subject } from 'rxjs';

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
    state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo && (Object.keys(state.getDotSamaApiMap()).length !== 0 || Object.keys(state.getWeb3ApiMap()).length !== 0)) {
        this.addCron('refreshPrice', this.refreshPrice, CRON_REFRESH_PRICE_INTERVAL);
        this.addCron('checkStatusApiMap', this.updateApiMapStatus, CRON_GET_API_MAP_STATUS);
        this.addCron('recoverApiMap', this.recoverApiMap, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);

        this.addCron('refreshNft', this.refreshNft(currentAccountInfo.address, state.getApiMap(), state.getActiveErc721Tokens()), CRON_REFRESH_NFT_INTERVAL);
        this.addCron('refreshStakingReward', this.refreshStakingReward(currentAccountInfo.address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
        this.addCron('refreshHistory', this.refreshHistory(currentAccountInfo.address, state.getNetworkMap()), CRON_REFRESH_HISTORY_INTERVAL);
      } else {
        this.setNftReady();
        this.setStakingRewardReady();
      }

      state.subscribeServiceInfo().subscribe({
        next: (serviceInfo) => {
          const { address } = serviceInfo.currentAccountInfo;

          this.resetNft();
          this.resetNftTransferMeta();
          // this.resetStakingReward(address);
          this.resetHistory();
          this.removeCron('refreshNft');
          this.removeCron('refreshStakingReward');
          this.removeCron('refreshHistory');

          this.removeCron('refreshPrice');
          this.removeCron('checkStatusApiMap');
          this.removeCron('recoverApiMap');

          if (Object.keys(serviceInfo.apiMap.dotSama).length !== 0 || Object.keys(serviceInfo.apiMap.web3).length !== 0) { // only add cron job if there's at least 1 active network
            this.addCron('refreshPrice', this.refreshPrice, CRON_REFRESH_PRICE_INTERVAL);
            this.addCron('checkStatusApiMap', this.updateApiMapStatus, CRON_GET_API_MAP_STATUS);
            this.addCron('recoverApiMap', this.recoverApiMap, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);

            this.addCron('refreshNft', this.refreshNft(address, serviceInfo.apiMap, serviceInfo.customErc721Registry), CRON_REFRESH_NFT_INTERVAL);
            this.addCron('refreshStakingReward', this.refreshStakingReward(address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
            this.addCron('refreshHistory', this.refreshHistory(address, serviceInfo.networkMap), CRON_REFRESH_HISTORY_INTERVAL);
          } else {
            this.setNftReady();
            this.setStakingRewardReady();
          }
        }
      });
    });
  }

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
      this.subscriptions?.subscribeBalancesAndCrowdloans && this.subscriptions.subscribeBalancesAndCrowdloans(address, state.getDotSamaApiMap(), state.getWeb3ApiMap());
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

  refreshNft (address: string, apiMap: ApiMap, customErc721Registry: CustomEvmToken[]) {
    return () => {
      console.log('Refresh Nft state');
      this.subscriptions.subscribeNft(address, apiMap.dotSama, apiMap.web3, customErc721Registry);
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

  resetStakingReward (address: string) {
    state.resetStakingMap(address).catch((err) => console.warn(err));
    state.setStakingReward({
      ready: false,
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

  refreshHistory (address: string, networkMap: Record<string, NetworkJson>) {
    return () => {
      console.log('Refresh History state');
      fetchDotSamaHistory(address, networkMap, (historyMap) => {
        console.log('--- historyMap ---', historyMap);
        state.setHistory(historyMap);
      });
    };
  }

  setNftReady () {
    state.updateNftReady(true);
  }

  setStakingRewardReady () {
    state.updateStakingRewardReady(true);
  }

  resetHistory () {
    state.setHistory({});
  }
}
