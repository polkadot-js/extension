// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import BaseMigrationJob from '@subwallet/extension-koni-base/migration/Base';
import TransactionHistoryStore from '@subwallet/extension-koni-base/stores/TransactionHistory';
import TransactionHistoryStoreV2 from '@subwallet/extension-koni-base/stores/TransactionHistoryV2';

import { accounts } from '@polkadot/ui-keyring/observable/accounts';

const getOldKey = (address: string, networkKey: string) => {
  return `${address}_${networkKey}`;
};

export default class ChangeTransactionHistoryStore extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const oldStore = new TransactionHistoryStore();
    const newStore = new TransactionHistoryStoreV2();

    const addressList = Object.keys(accounts.subject.value);

    for (const address of addressList) {
      const transactions: Record<string, TransactionHistoryItemType[]> = {};

      for (const networkJson of Object.values(this.state.getNetworkMap())) {
        const histories = await oldStore.asyncGet(getOldKey(address, networkJson.key));
        const hash = this.state.getNetworkGenesisHashByKey(networkJson.key);

        if (histories && histories.length) {
          transactions[hash] = histories;
        }
      }

      if (Object.keys(transactions).length > 0) {
        newStore.set(address, transactions);
      }

      // TODO: remove old transaction data in next version
    }
  }
}
