// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ITransactionHistoryItem } from '../databases';
import BaseStoreWithAddress from './BaseStoreWithAddress';

export default class TransactionStore extends BaseStoreWithAddress<ITransactionHistoryItem> {
  async getHistoryByAddressAsObject (address: string) {
    const data = await this.table.where('address').equals(address).toArray();

    return this.convertHistoriesToJsonObject(data);
  }

  convertHistoriesToJsonObject (items: ITransactionHistoryItem[]): Record<string, ITransactionHistoryItem[]> {
    return items.reduce((a, v) => {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const value = Array.isArray(a[v.chain]) ? [...a[v.chain], v] : [v];

      return { ...a, [v.chain]: value };
    }, {});
  }
}
