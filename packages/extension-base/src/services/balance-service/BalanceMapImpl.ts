// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { BalanceInfo, BalanceItem, BalanceMap } from '@subwallet/extension-base/types';
import { isAccountAll } from '@subwallet/extension-base/utils';
import { BehaviorSubject } from 'rxjs';

import { groupBalance } from './helpers';

export class BalanceMapImpl {
  private _mapSubject: BehaviorSubject<BalanceMap>;

  constructor (private _map: BalanceMap = {}) {
    this._mapSubject = new BehaviorSubject<BalanceMap>(_map);
  }

  public get map (): BalanceMap {
    return this._mapSubject.getValue();
  }

  public get mapSubject () {
    return this._mapSubject;
  }

  public setData (map: BalanceMap) {
    this._map = map;
    this.triggerChange();
  }

  public setAddressData (address: string, data: BalanceInfo) {
    this._map[address] = data;
    this.triggerChange();
  }

  public triggerChange (computeAll?: boolean): void {
    if (computeAll) {
      this.computeAllAccountBalance();
    }

    this._mapSubject.next(this._map);
  }

  public updateBalanceItem (balanceItem: BalanceItem, trigger = false): void {
    const { address, tokenSlug } = balanceItem;

    if (!this._map[address]) {
      this._map[address] = {};
    }

    this._map[address][tokenSlug] = balanceItem;

    trigger && this.triggerChange();
  }

  public updateBalanceItems (balanceItems: BalanceItem[], computeAll?: boolean): void {
    balanceItems.forEach((balanceItem) => {
      this.updateBalanceItem(balanceItem);
    });

    this.triggerChange(computeAll);
  }

  public removeBalanceItemByFilter (filter: (balanceItem: BalanceItem) => boolean): void {
    Object.keys(this._map).forEach((address) => {
      Object.keys(this._map[address]).forEach((tokenSlug) => {
        if (filter(this._map[address][tokenSlug])) {
          delete this._map[address][tokenSlug];
        }
      });
    });

    this.triggerChange();
  }

  public computeAllAccountBalance () {
    const allAccountBalanceInfo: BalanceInfo = {};
    const allAccountBalance: Record<string, BalanceItem[]> = {};

    Object.keys(this._map)
      .filter((a) => !isAccountAll(a))
      .forEach((address) => {
        Object.keys(this._map[address]).forEach((tokenSlug) => {
          if (!allAccountBalance[tokenSlug]) {
            allAccountBalance[tokenSlug] = [];
          }

          allAccountBalance[tokenSlug].push(this._map[address][tokenSlug]);
        });
      });

    Object.entries(allAccountBalance).forEach(([tokenSlug, balanceItems]) => {
      allAccountBalanceInfo[tokenSlug] = groupBalance(balanceItems, ALL_ACCOUNT_KEY, tokenSlug);
    });

    this._map[ALL_ACCOUNT_KEY] = allAccountBalanceInfo;
  }

  // Remove balance items buy address or tokenSlug
  public removeBalanceItems (addresses?: string[], tokenSlugs?: string[]): void {
    // If addresses is empty, remove all
    if (addresses && tokenSlugs) {
      addresses.forEach((address) => {
        tokenSlugs.forEach((tokenSlug) => {
          this._map[address] && this._map[address][tokenSlug] && delete this._map[address][tokenSlug];
        });
      });
    } else if (addresses && !tokenSlugs) {
      addresses.forEach((address) => {
        this._map[address] && delete this._map[address];
      });
    } else if (!addresses && tokenSlugs) {
      Object.keys(this._map).forEach((address) => {
        tokenSlugs.forEach((tokenSlug) => {
          this._map[address][tokenSlug] && delete this._map[address][tokenSlug];
        });
      });
    } else {
      this._map = {};
    }

    this.triggerChange();
  }
}
