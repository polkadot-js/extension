// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomEvmToken, NftTransferExtra, StakingRewardJson } from '@subwallet/extension-base/background/KoniTypes';
import { getTokenPrice } from '@subwallet/extension-koni-base/api/coingecko';
import { fetchDotSamaHistory } from '@subwallet/extension-koni-base/api/subquery/history';
import { recoverWeb3Api, web3Map } from '@subwallet/extension-koni-base/api/web3/web3';
import { dotSamaAPIMap, state } from '@subwallet/extension-koni-base/background/handlers';
import { KoniSubcription } from '@subwallet/extension-koni-base/background/subscription';
import { CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, CRON_AUTO_RECOVER_WEB3_INTERVAL, CRON_REFRESH_HISTORY_INTERVAL, CRON_REFRESH_NFT_INTERVAL, CRON_REFRESH_PRICE_INTERVAL, CRON_REFRESH_STAKING_REWARD_INTERVAL, DOTSAMA_MAX_CONTINUE_RETRY } from '@subwallet/extension-koni-base/constants';
import { Subject } from 'rxjs';

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
    // this.addCron('refreshPrice', this.refreshPrice, CRON_REFRESH_PRICE_INTERVAL);
    this.addCron('recoverAPI', this.recoverAPI, CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);
    this.addCron('recoverWeb3', this.recoverWeb3Api, CRON_AUTO_RECOVER_WEB3_INTERVAL, false);

    // state.getCurrentAccount((currentAccountInfo) => {
    //   if (currentAccountInfo) {
    //     this.addCron('refreshNft', this.refreshNft(currentAccountInfo.address, state.getErc721Tokens()), CRON_REFRESH_NFT_INTERVAL);
    //     this.addCron('refreshStakingReward', this.refreshStakingReward(currentAccountInfo.address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
    //     this.addCron('refreshHistory', this.refreshHistory(currentAccountInfo.address), CRON_REFRESH_HISTORY_INTERVAL);
    //   }
    //
    //   state.subscribeServiceInfo_().subscribe({
    //     next: ({ currentAccount: address, customErc721Registry }) => {
    //       this.resetNft();
    //       this.resetNftTransferMeta();
    //       this.resetStakingReward();
    //       this.resetHistory();
    //       this.removeCron('refreshNft');
    //       this.removeCron('refreshStakingReward');
    //       this.removeCron('refreshHistory');
    //
    //       this.addCron('refreshNft', this.refreshNft(address, customErc721Registry), CRON_REFRESH_NFT_INTERVAL);
    //       this.addCron('refreshStakingReward', this.refreshStakingReward(address), CRON_REFRESH_STAKING_REWARD_INTERVAL);
    //       this.addCron('refreshHistory', this.refreshHistory(address), CRON_REFRESH_HISTORY_INTERVAL);
    //     }
    //   });
    // });
  }

  recoverAPI () {
    state.getCurrentAccount(({ address }) => {
      console.log('Auto recovering API');
      Object.values(dotSamaAPIMap).forEach((apiProp) => {
        if (apiProp.apiRetry && apiProp.apiRetry > DOTSAMA_MAX_CONTINUE_RETRY) {
          apiProp.recoverConnect && apiProp.recoverConnect();
        }
      });

      // this.subscriptions?.subscribeBalancesAndCrowdloans && this.subscriptions.subscribeBalancesAndCrowdloans(address);
    });
  }

  recoverWeb3Api () {
    console.log('check web3 connection');

    for (const [key, web3] of Object.entries(web3Map)) {
      web3.eth.net.isListening()
        .catch(() => {
          console.log('web3 disconnected', key);
          recoverWeb3Api(key);
        });
    }

    console.log('check web3 connection done');
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

  refreshNft (address: string, customErc721Registry: CustomEvmToken[]) {
    return () => {
      console.log('Refresh Nft state');
      this.subscriptions.subscribeNft(address, customErc721Registry);
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
