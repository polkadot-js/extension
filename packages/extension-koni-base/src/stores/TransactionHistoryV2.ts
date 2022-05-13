// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import { EXTENSION_PREFIX } from '@subwallet/extension-base/defaults';
import SubscribableStore from '@subwallet/extension-koni-base/stores/SubscribableStore';

export default class TransactionHistoryStoreV2 extends SubscribableStore<TransactionHistoryItemType[]> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}transaction_history_v2` : null);
  }
}
