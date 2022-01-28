// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import State from '@polkadot/extension-base/background/handlers/State';
import { APIItemState, BalanceItem, BalanceJson, CrowdloanItem, CrowdloanJson, CurrentAccountInfo, PriceJson } from '@polkadot/extension-base/background/KoniTypes';
import { getTokenPrice } from '@polkadot/extension-koni-base/api/coingecko';
import { CurrentAccountStore, PriceStore } from '@polkadot/extension-koni-base/stores';
import { Subject } from 'rxjs';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';

function generateDefaultBalanceMap () {
  const balanceMap: Record<string, BalanceItem> = {};

  Object.keys(NETWORKS).forEach((networkKey) => {
    balanceMap[networkKey] = {
      state: APIItemState.PENDING,
      free: '0',
      reserved: '0',
      miscFrozen: '0',
      feeFrozen: '0'
    };
  });

  return balanceMap;
}

function generateDefaultCrowdloanMap () {
  const crowdloanMap: Record<string, CrowdloanItem> = {};

  Object.keys(NETWORKS).forEach((networkKey) => {
    crowdloanMap[networkKey] = {
      state: APIItemState.PENDING,
      contribute: '0'
    };
  });

  return crowdloanMap;
}

export default class KoniState extends State {
  private readonly priceStore = new PriceStore();
  private priceStoreReady = false;
  private readonly currentAccountStore = new CurrentAccountStore();

  // Todo: Persist data to balanceStore later
  // private readonly balanceStore = new BalanceStore();
  private balanceMap: Record<string, BalanceItem> = generateDefaultBalanceMap();
  private balanceSubject = new Subject<BalanceJson>();
  private crowdloanMap: Record<string, CrowdloanItem> = generateDefaultCrowdloanMap();
  private crowdloanSubject = new Subject<CrowdloanJson>();

  public getCurrentAccount (update: (value: CurrentAccountInfo) => void): void {
    this.currentAccountStore.get('CurrentAccountInfo', update);
  }

  public setCurrentAccount (data: CurrentAccountInfo, callback?: () => void): void {
    this.currentAccountStore.set('CurrentAccountInfo', data, callback);
  }

  public subscribeCurrentAccount (): Subject<CurrentAccountInfo> {
    return this.currentAccountStore.getSubject();
  }

  public getAccountAddress () {
    return new Promise((resolve, reject) => {
      this.getCurrentAccount(({ address }) => {
        resolve(address);
      });
    });
  }

  public getBalance (): BalanceJson {
    return { details: this.balanceMap } as BalanceJson;
  }

  public setBalanceItem (networkKey: string, item: BalanceItem) {
    this.balanceMap[networkKey] = item;
    this.balanceSubject.next(this.getBalance());
  }

  public subscribeBalance () {
    return this.balanceSubject;
  }

  public getCrowdloan (): CrowdloanJson {
    return { details: this.crowdloanMap } as CrowdloanJson;
  }

  public setCrowdloanItem (networkKey: string, item: CrowdloanItem) {
    this.crowdloanMap[networkKey] = item;
    this.crowdloanSubject.next(this.getCrowdloan());
  }

  public subscribeCrowdloan () {
    return this.crowdloanSubject;
  }

  public setPrice (priceData: PriceJson, callback?: (priceData: PriceJson) => void): void {
    this.priceStore.set('PriceData', priceData, () => {
      if (callback) {
        callback(priceData);
        this.priceStoreReady = true;
      }
    });
  }

  public getPrice (update: (value: PriceJson) => void): void {
    this.priceStore.get('PriceData', (rs) => {
      if (this.priceStoreReady) {
        update(rs);
      } else {
        getTokenPrice()
          .then((rs) => {
            this.setPrice(rs);
            update(rs);
          })
          .catch((err) => {
            console.error(err);
            throw err;
          });
      }
    });
  }

  public subscribePrice () {
    return this.priceStore.getSubject();
  }
}
