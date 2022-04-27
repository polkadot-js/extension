// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Subject } from 'rxjs';

import { NftTransferExtra, StakingRewardJson } from '@polkadot/extension-base/background/KoniTypes';
import { getTokenPrice } from '@polkadot/extension-koni-base/api/coingecko';
import { fetchDotSamaHistory } from '@polkadot/extension-koni-base/api/subquery/history';
import { recoverWeb3Api, web3Map } from '@polkadot/extension-koni-base/api/web3/web3';
import { dotSamaAPIMap, state } from '@polkadot/extension-koni-base/background/handlers';
import { KoniSubcription } from '@polkadot/extension-koni-base/background/subscription';
import {
  CRON_AUTO_RECOVER_DOTSAMA_INTERVAL,
  CRON_AUTO_RECOVER_WEB3_INTERVAL,
  CRON_REFRESH_HISTORY_INTERVAL,
  CRON_REFRESH_NFT_INTERVAL,
  CRON_REFRESH_PRICE_INTERVAL,
  CRON_REFRESH_STAKING_REWARD_INTERVAL,
  DOTSAMA_MAX_CONTINUE_RETRY
} from '@polkadot/extension-koni-base/constants';

export class KoniCron {
  subscriptions: KoniSubcription;

  constructor (subscriptions: KoniSubcription) {
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
    this.addCron('recoverAPI', this.recoverAPI, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);
    this.addCron('recoverWeb3', this.recoverWeb3Api, CRON_AUTO_RECOVER_WEB3_INTERVAL, false);

    state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo) {
        this.addCron('refreshNft', this.refreshNft(currentAccountInfo.address), CRON_REFRESH_NFT_INTERVAL);
        this.addCron('refreshStakingReward', this.refreshStakingReward(currentAccountInfo.address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
        this.addCron('refreshHistory', this.refreshHistory(currentAccountInfo.address), CRON_REFRESH_HISTORY_INTERVAL);
      }

      state.subscribeCurrentAccount().subscribe({
        next: ({ address }) => {
          this.resetNft();
          this.resetNftTransferMeta();
          this.resetStakingReward();
          this.resetHistory();
          this.removeCron('refreshNft');
          this.removeCron('refreshStakingReward');
          this.removeCron('refreshHistory');

          this.addCron('refreshNft', this.refreshNft(address), CRON_REFRESH_NFT_INTERVAL);
          this.addCron('refreshStakingReward', this.refreshStakingReward(address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
          this.addCron('refreshHistory', this.refreshHistory(address), CRON_REFRESH_HISTORY_INTERVAL);
        }
      });
    });
  }

  recoverAPI () {
    state.getCurrentAccount(({ address }) => {
      console.log('Auto recovering API');
      Object.values(dotSamaAPIMap).forEach((apiProp) => {
        if (apiProp.apiRetry && apiProp.apiRetry > DOTSAMA_MAX_CONTINUE_RETRY) {
          apiProp.recoverConnect && apiProp.recoverConnect();
        }
      });

      this.subscriptions?.subscribeBalancesAndCrowdloans && this.subscriptions.subscribeBalancesAndCrowdloans(address);
    });
  }

  recoverWeb3Api () {
    console.log('recover web3 in progress');

    for (const [key, web3] of Object.entries(web3Map)) {
      web3.eth.net.isListening()
        .catch(() => {
          console.log('recovered web3 for', key);
          recoverWeb3Api(key);
        });
    }
  }

  refreshPrice () {
    getTokenPrice()
      .then((rs) => {
        state.setPrice(rs, () => {
          console.log('Get Token Price From CoinGecko');
        });
      })
      .catch((err) => console.log(err));
  }

  refreshNft (address: string) {
    return () => {
      console.log('Refresh Nft state');
      this.subscriptions.subscribeNft(address);
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
