// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import State from '@polkadot/extension-base/background/handlers/State';
import { CurrentAccountInfo } from '@polkadot/extension-base/background/types';
import { getTokenPrice } from '@polkadot/extension-koni-base/api/coingecko';
import { PriceStore } from '@polkadot/extension-koni-base/stores';
import CurrentAccountStore from '@polkadot/extension-koni-base/stores/CurrentAccountStore';
import { PriceJson } from '@polkadot/extension-koni-base/stores/types';

export default class KoniState extends State {
  private readonly priceStore = new PriceStore();
  private readonly currentAccountStore = new CurrentAccountStore();
  private priceStoreReady = false;

  public getCurrentAccount (update: (value: CurrentAccountInfo) => void): void {
    this.currentAccountStore.get('CurrentAccountInfo', update);
  }

  public setCurrentAccount (data: CurrentAccountInfo, callback?: () => void): void {
    this.currentAccountStore.set('CurrentAccountInfo', data, callback);
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
