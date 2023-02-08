// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseStoreWithAddressAndChain from '@subwallet/extension-base/services/storage-service/db-stores/BaseStoreWithAddressAndChain';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-koni-base/constants';

import { ITransactionHistoryItem } from '../databases';

export default class TransactionStore extends BaseStoreWithAddressAndChain<ITransactionHistoryItem> {
  async getHistoryByAddressAsObject (address: string) {
    if (address === ALL_ACCOUNT_KEY) {
      return this.table.toArray();
    }

    return this.table.where('address').equals(address).toArray();
  }

  // convertHistoriesToJsonObject (items: ITransactionHistoryItem[]): Record<string, ITransactionHistoryItem[]> {
  //   return items.reduce((a, v) => {
  //     // @ts-ignore
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //     const value = Array.isArray(a[v.chain]) ? [...a[v.chain], v] : [v];
  //
  //     return { ...a, [v.chain]: value };
  //   }, {});
  // }

  public override async bulkUpsert (records: ITransactionHistoryItem[]): Promise<unknown> {
    await this.table.bulkPut(records);

    await Promise.all(records.map((record) => {
      return this.table.where({
        chain: record.chain,
        address: record.address,
        extrinsicHash: record.extrinsicHash
      }).filter((item) => (item.origin === 'app' && record.origin !== 'app'))
        .delete();
    }));

    return true;
  }
}
