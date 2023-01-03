// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItemJson } from '@subwallet/extension-base/background/KoniTypes';
import TransactionHistoryStoreV3 from '@subwallet/extension-base/stores/TransactionHistoryV3';
import BaseMigrationJob from '@subwallet/extension-koni-base/migration/Base';

import { accounts } from '@polkadot/ui-keyring/observable/accounts';

export default class RemoveWrongTransactionHistoriesFromStore extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const newStore = new TransactionHistoryStoreV3();

    const addressList = Object.keys(accounts.subject.value);

    for (const address of addressList) {
      const oldHistories = await newStore.asyncGet(address);
      const newHistories: Record<string, TransactionHistoryItemJson> = {};

      Object.entries(oldHistories).forEach(([hash, items]) => {
        // Remove wrong stored history (missing eventIdx)
        const newItems = items.items.filter((item) => item.origin === 'app' || item.eventIdx);

        newHistories[hash] = { items: newItems, total: newItems.length };
      });

      if (Object.keys(newHistories).length > 0) {
        newStore.set(address, newHistories);
      }
    }
  }
}
