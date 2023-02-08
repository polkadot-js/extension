// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TxHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { EXTENSION_PREFIX } from '@subwallet/extension-base/defaults';
import SubscribableStore from '@subwallet/extension-base/stores/SubscribableStore';

const lastError = (type: string): void => {
  const error = chrome.runtime.lastError;

  if (error) {
    console.error(`TransactionHistoryStore.${type}:: runtime.lastError:`, error);
  }
};

export default class TransactionHistoryStore extends SubscribableStore<TxHistoryItem[]> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}transaction_history` : null);
  }

  public getByMultiKeys (_keys: string[], update: (value: TxHistoryItem[]) => void): void {
    const keys: string[] = _keys.map((k) => `${this.getPrefix()}${k}`);

    chrome.storage.local.get(keys, (result: Record<string, TxHistoryItem[]>): void => {
      lastError('getByMultiKey');

      const items: TxHistoryItem[] = [];

      keys.forEach((k) => {
        if (result[k]) {
          items.push(...result[k]);
        }
      });

      update(items);
    });
  }
}
