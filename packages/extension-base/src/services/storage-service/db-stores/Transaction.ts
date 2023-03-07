// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseStoreWithAddressAndChain from '@subwallet/extension-base/services/storage-service/db-stores/BaseStoreWithAddressAndChain';

import { ITransactionHistoryItem } from '../databases';

export interface HistoryQuery {chain?: string, address?: string}

export default class TransactionStore extends BaseStoreWithAddressAndChain<ITransactionHistoryItem> {
  async getHistoryByAddressAsObject (address: string) {
    if (address === 'ALL') { // Todo: Migrate to all account key
      return this.table.toArray();
    }

    return this.table.where('address').equals(address).toArray();
  }

  public async queryHistory (query?: HistoryQuery) {
    if (!query?.address && !query?.chain) {
      return this.table.toArray();
    } else {
      const queryObject = {} as HistoryQuery;

      if (query?.chain) {
        queryObject.chain = query?.chain;
      }

      if (query?.address) {
        queryObject.address = query?.address;
      }

      return this.table.where(queryObject).toArray();
    }
  }

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
