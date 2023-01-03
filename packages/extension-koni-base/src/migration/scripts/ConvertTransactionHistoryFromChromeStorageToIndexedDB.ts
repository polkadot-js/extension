// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import TransactionHistoryStore from '@subwallet/extension-base/stores/TransactionHistory';
import TransactionHistoryStoreV2 from '@subwallet/extension-base/stores/TransactionHistoryV2';
import TransactionHistoryStoreV3 from '@subwallet/extension-base/stores/TransactionHistoryV3';
import BaseMigrationJob from '@subwallet/extension-koni-base/migration/Base';

import { accounts } from '@polkadot/ui-keyring/observable/accounts';

const getOldKey = (address: string, networkKey: string) => {
  return `${address}_${networkKey}`;
};

export default class ConvertTransactionHistoryFromChromeStorageToIndexedDB extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const storeV1 = new TransactionHistoryStore();
    const storeV2 = new TransactionHistoryStoreV2();
    const storeV3 = new TransactionHistoryStoreV3();

    const addressList = Object.keys(accounts.subject.value);

    for (const address of addressList) {
      this.logger.log(`Converting transaction history for address [${address}]`);
      const v2Data = await storeV2.asyncGet(address);
      const v3Data = await storeV3.asyncGet(address);

      for (const networkJson of Object.values(this.state.getNetworkMap())) {
        this.logger.log(`Converting transaction history for network [${networkJson.key}]`);
        let v1Items = await storeV1.asyncGet(getOldKey(address, networkJson.key));
        const hash = this.state.getNetworkGenesisHashByKey(networkJson.key);

        // For custom network
        if (!networkJson.key.includes('custom_')) {
          const customStoreKey = `${address}_custom_${networkJson.genesisHash}`;
          const customHistories = await storeV1.asyncGet(customStoreKey);

          if (Array.isArray(customHistories) && customHistories.length) {
            if (!Array.isArray(v1Items) || !v1Items.length) {
              v1Items = customHistories;
            } else {
              const newHistories = customHistories.filter((item) => !v1Items.some((old) => this.isSameHistory(old, item)));

              v1Items = [...v1Items, ...newHistories];
            }
          }
        }

        const v2Items = v2Data && Array.isArray(v2Data[hash]) ? v2Data[hash] || [] : [];
        const v3Items = v3Data && Array.isArray(v3Data[hash]?.items) ? v3Data[hash]?.items || [] : [];

        v1Items = Array.isArray(v1Items) ? v1Items.map((item) => ({ origin: 'app', eventIdx: 0, ...item }) as TransactionHistoryItemType) : [];
        let allItems = v3Items;

        allItems = this.mergeHistories(allItems, v2Items);
        allItems = this.mergeHistories(allItems, v1Items);
        this.state.setHistory(address, networkJson.key, allItems);
      }

      // TODO: remove old transaction data in next version
    }
  }

  mergeHistories (allItems: TransactionHistoryItemType[], newItems: TransactionHistoryItemType[]) {
    const oldItems = newItems.filter((item) => !allItems.some((newItem) => this.isSameHistory(newItem, item)));

    return allItems.concat(oldItems);
  }

  isSameHistory (newItem: TransactionHistoryItemType, oldItem: TransactionHistoryItemType) {
    return (newItem.extrinsicHash === oldItem.extrinsicHash) && (!newItem.eventIdx || !oldItem.eventIdx || newItem.eventIdx === oldItem.eventIdx);
  }
}
