// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceMap } from '@subwallet/extension-base/types';

import { IBalance } from '../databases';
import BaseStoreWithAddress from '../db-stores/BaseStoreWithAddress';

export default class BalanceStore extends BaseStoreWithAddress<IBalance> {
  async getBalanceMapByAddresses (addresses: string): Promise<BalanceMap> {
    const data = await this.table.where('address').anyOf(addresses).toArray();

    const balanceMap: BalanceMap = {};

    data.forEach((storedBalance) => {
      const address = storedBalance.address;
      const slug = storedBalance.tokenSlug;

      if (!balanceMap[address]) {
        balanceMap[address] = {};
      }

      balanceMap[address][slug] = { ...storedBalance };
    });

    return balanceMap;
  }

  async removeBySlugs (tokenSlugs: string[]) {
    return this.table.where('tokenSlug').anyOfIgnoreCase(tokenSlugs).delete();
  }
}
