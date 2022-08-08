// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import BaseMigrationJob from '@subwallet/extension-koni-base/migration/Base';
import TransactionHistoryStoreV2 from '@subwallet/extension-koni-base/stores/TransactionHistoryV2';

import { accounts } from '@polkadot/ui-keyring/observable/accounts';

export default class RemoveWrongTransactionHistoriesFromStore extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const newStore = new TransactionHistoryStoreV2();

    const addressList = Object.keys(accounts.subject.value);

    for (const address of addressList) {
      const oldHistories = await newStore.asyncGet(address);
      const newHistories: Record<string, TransactionHistoryItemType[]> = {};

      Object.entries(oldHistories).forEach(([hash, items]) => {
        // Remove wrong stored history (missing eventIdx)
        const newItems = items.filter((item) => item.origin === 'app' || item.eventIdx);

        newHistories[hash] = newItems;
      });

      if (Object.keys(newHistories).length > 0) {
        newStore.set(address, newHistories);
      }
    }
  }
}
