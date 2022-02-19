// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Subject } from 'rxjs';

import { getTokenPrice } from '@polkadot/extension-koni-base/api/coingecko';
import { state } from '@polkadot/extension-koni-base/background/handlers';
import { KoniSubcription } from '@polkadot/extension-koni-base/background/subcription';
import { CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, CRON_REFRESH_NFT_INTERVAL, CRON_REFRESH_PRICE_INTERVAL, CRON_REFRESH_STAKING_INTERVAL } from '@polkadot/extension-koni-base/constants';

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

    state.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo) {
        console.log('at cron', currentAccountInfo);
        this.addCron('refreshNft', this.refreshNft(currentAccountInfo.address), CRON_REFRESH_NFT_INTERVAL);
        this.addCron('refreshStaking', this.refreshStaking(currentAccountInfo.address), CRON_REFRESH_STAKING_INTERVAL);
      }

      state.subscribeCurrentAccount().subscribe({
        next: ({ address }) => {
          console.log('at cron subscribe', address);
          this.removeCron('refreshNft');
          this.removeCron('refreshStaking');

          this.addCron('refreshNft', this.refreshNft(address), CRON_REFRESH_NFT_INTERVAL);
          this.addCron('refreshStaking', this.refreshStaking(address), CRON_REFRESH_STAKING_INTERVAL);
        }
      });
    });
  }

  recoverAPI () {
    state.getCurrentAccount(({ address }) => {
      console.log('Auto recovering API');
      this.subscriptions?.subscribleBalancesAndCrowdloans && this.subscriptions.subscribleBalancesAndCrowdloans(address);
    });
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

  refreshStaking (address: string) {
    return () => {
      console.log('Refresh Staking state');
      this.subscriptions.subscribeStaking(address);
    };
  }
}
