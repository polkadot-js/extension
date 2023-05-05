// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseStoreWithAddressAndChain from '@subwallet/extension-base/services/storage-service/db-stores/BaseStoreWithAddressAndChain';

import { ITransactionHistoryItem } from '../databases';

export interface HistoryQuery {chain?: string, address?: string, extrinsicHash?: string, transactionId?: string}

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

      if (query?.extrinsicHash) {
        queryObject.extrinsicHash = query?.extrinsicHash;
      }

      if (query?.address) {
        queryObject.address = query?.address;
      }

      return this.table.where(queryObject).toArray();
    }
  }

  public override async bulkUpsert (records: ITransactionHistoryItem[]): Promise<unknown> {
    await this.table.bulkPut(records);

    return true;
  }

  public async updateWithQuery (query: HistoryQuery, update: Partial<ITransactionHistoryItem>): Promise<unknown> {
    await this.table.where(query)
      .modify((record) => {
        return Object.assign(record, update);
      });

    return true;
  }
}
