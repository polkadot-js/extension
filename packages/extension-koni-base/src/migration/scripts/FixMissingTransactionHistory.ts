// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItemJson, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import BaseMigrationJob from '@subwallet/extension-koni-base/migration/Base';
import TransactionHistoryStore from '@subwallet/extension-koni-base/stores/TransactionHistory';
import TransactionHistoryStoreV2 from '@subwallet/extension-koni-base/stores/TransactionHistoryV2';
import TransactionHistoryStoreV3 from '@subwallet/extension-koni-base/stores/TransactionHistoryV3';
import { accounts } from '@subwallet/ui-keyring/observable/accounts';

const getOldKey = (address: string, networkKey: string) => {
  return `${address}_${networkKey}`;
};

export default class FixMissingTransactionHistory extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const oldStore = new TransactionHistoryStore();
    const newStoreV2 = new TransactionHistoryStoreV2();
    const newStoreV3 = new TransactionHistoryStoreV3();

    const addressList = Object.keys(accounts.subject.value);

    for (const address of addressList) {
      const transactions: Record<string, TransactionHistoryItemJson> = {};
      const v2Data = await newStoreV2.asyncGet(address);

      for (const networkJson of Object.values(this.state.getNetworkMap())) {
        let histories = await oldStore.asyncGet(getOldKey(address, networkJson.key));
        const hash = this.state.getNetworkGenesisHashByKey(networkJson.key);

        // For custom network
        if (!networkJson.key.includes('custom_')) {
          const customStoreKey = `${address}_custom_${networkJson.genesisHash}`;
          const customHistories = await oldStore.asyncGet(customStoreKey);

          if (Array.isArray(customHistories) && customHistories.length) {
            if (!Array.isArray(histories) || !histories.length) {
              histories = customHistories;
            } else {
              const newHistories = customHistories.filter((item) => !histories.some((old) => this.state.isSameHistory(old, item)));

              histories = [...histories, ...newHistories];
            }
          }
        }

        if (histories && histories.length) {
          // Merge new transaction histories
          const newItems = Array.isArray(v2Data[hash]) ? v2Data[hash] || [] : [];

          histories = histories.filter((item) => !newItems.some((newItem) => this.state.isSameHistory(newItem, item)));
          histories = histories.concat(newItems);
          const sortedHistories = histories.map((item) => ({ origin: 'app', ...item } as TransactionHistoryItemType)).sort((a, b) => b.time - a.time);

          transactions[hash] = {
            items: sortedHistories,
            total: sortedHistories.length
          };
        }
      }

      if (Object.keys(transactions).length > 0) {
        newStoreV3.set(address, transactions);
      }

      // TODO: remove old transaction data in next version
    }
  }
}
