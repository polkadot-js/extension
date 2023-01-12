// Copyright 2019-2022 @subwallet/extension-base authors & contributors
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
      const value = Array.isArray(a[v._chain]) ? [...a[v._chain], v] : [v];

      return { ...a, [v._chain]: value };
    }, {});
  }

  public override async bulkUpsert (records: ITransactionHistoryItem[]): Promise<unknown> {
    await this.table.bulkPut(records);

    await Promise.all(records.map((record) => {
      return this.table.where({
        chainHash: record.chainHash,
        address: record.address,
        extrinsicHash: record.extrinsicHash
      }).filter((item) => (item.origin === 'app' && record.origin !== 'app') || (item.eventIdx === 0 && record.eventIdx !== 0))
        .delete();
    }));

    return true;
  }
}
