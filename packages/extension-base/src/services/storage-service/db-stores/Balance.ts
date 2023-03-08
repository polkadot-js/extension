// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceItem } from '@subwallet/extension-base/background/KoniTypes';

import { IBalance } from '../databases';
import BaseStoreWithAddress from '../db-stores/BaseStoreWithAddress';

export default class BalanceStore extends BaseStoreWithAddress<IBalance> {
  async getBalanceMapByAddress (address: string) {
    const data = await this.table.where('address').equals(address).toArray();

    const balanceMap: Record<string, BalanceItem> = {};

    data.forEach((storedBalance) => {
      balanceMap[storedBalance.tokenSlug] = {
        tokenSlug: storedBalance.tokenSlug,
        state: storedBalance.state,
        free: storedBalance.free,
        locked: storedBalance.locked,
        substrateInfo: storedBalance.substrateInfo,
        timestamp: storedBalance.timestamp
      } as BalanceItem;
    });

    return balanceMap;
  }

  async removeBySlugs (tokenSlugs: string[]) {
    return this.table.where('tokenSlug').anyOfIgnoreCase(tokenSlugs).delete();
  }

  // private balanceSub!: Subscription;
  // liveQueryBalance (address: string, cb: (result: BalanceJson) => void) {
  //   if (this.balanceSub) {
  //     this.balanceSub.unsubscribe();
  //   }
  //
  //   const subscription = liveQuery(
  //     () => this.table.where('address').equals(address).toArray()
  //   );
  //
  //   this.balanceSub = subscription.subscribe({
  //     next: (rs) => {
  //       const data = this.convertToJsonObject(rs);
  //
  //       if (Object.keys(data).length) {
  //         const res: BalanceJson = { details: data };
  //
  //         cb(res);
  //       }
  //     }
  //   });
  //
  //   return this.balanceSub;
  // }
}
