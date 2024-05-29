// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';
import { ITransactionHistoryItem } from '@subwallet/extension-base/services/storage-service/databases';

export default class MigrateTransactionHistoryBySymbol extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const state = this.state;

    try {
      const changeSlugsMap: Record<string, string> = {
        'commune-NATIVE-C': 'commune-NATIVE-COMAI'
      };

      const allTxs: ITransactionHistoryItem[] = [];

      await Promise.all(Object.entries(changeSlugsMap).map(async ([oldSlug, newSlug], i) => {
        const oldSlugSplit = oldSlug.split('-');
        const oldChainSlug = oldSlugSplit[0];
        const oldSymbolSlug = oldSlugSplit[2];

        const newSlugSplit = newSlug.split('-');
        const newSymbolSlug = newSlugSplit[2];

        const filterTransactions = await state.dbService.stores.transaction.table.where({ chain: oldChainSlug }).and((tx) => {
          return tx.amount?.symbol === oldSymbolSlug;
        }).toArray();

        if (filterTransactions.length > 0) {
          for (const transaction of filterTransactions) {
            if (transaction.amount && transaction.amount.symbol === oldSymbolSlug) {
              transaction.amount.symbol = newSymbolSlug;
            }

            if (transaction.fee && transaction.fee.symbol === oldSymbolSlug) {
              transaction.fee.symbol = newSymbolSlug;
            }
          }
        }

        allTxs.push(...filterTransactions);
      }));

      await state.dbService.stores.transaction.table.bulkPut(allTxs);
    } catch (e) {
      this.logger.error(e);
    }
  }
}
