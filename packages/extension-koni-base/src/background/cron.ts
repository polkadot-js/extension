// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Subject } from 'rxjs';

import { getTokenPrice } from '@polkadot/extension-koni-base/api/coingecko';
import { dotSamaAPIMap, state } from '@polkadot/extension-koni-base/background/handlers';
import {
  CRON_AUTO_RECOVER_DOTSAMA_INTERVAL,
  CRON_REFRESH_NFT_INTERVAL,
  CRON_REFRESH_PRICE_INTERVAL
} from '@polkadot/extension-koni-base/constants';
import {getAllNftsByAccount} from "@polkadot/extension-koni-base/api/nft";

export class KoniCron {
  private cronMap: Record<string, any> = {};
  private subjectMap: Record<string, Subject<any>> = {};

  getCron (name: string): any {
    return this.cronMap[name];
  }

  getSubjectMap (name: string): any {
    return this.subjectMap[name];
  }

  addCron (name: string, callback: () => void, interval: number) {
    callback();

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
    this.addCron('recoverAPI', this.recoverAPI, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL);
    this.addCron('refreshNft', this.refreshNft, CRON_REFRESH_NFT_INTERVAL);
  }

  recoverAPI () {
    Object.values(dotSamaAPIMap).forEach(async (apiProp) => {
      if (!apiProp.isApiReady) {
        await apiProp.isReady;
      }
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

  async refreshNft() {
    const currentAccount = await state.getAccountAddress()
    getAllNftsByAccount(currentAccount as string)
      .then((rs) => {
        state.setNft(rs, (nftData) => {
          console.log(`Fetched nft for address ${currentAccount}`);
        });
      })
      .catch((err) => console.log(err));
  }
}
