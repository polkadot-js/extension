// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import BaseStore from '@subwallet/extension-base/services/storage-service/db-stores/BaseStore';
import { liveQuery } from 'dexie';

export default class YieldPositionStore extends BaseStore<YieldPositionInfo> {
  async getAll () {
    return this.table.toArray();
  }

  async getByAddress (addresses: string[]) {
    if (addresses.length === 0) {
      return this.getAll();
    }

    return this.table.where('address').anyOfIgnoreCase(addresses).toArray();
  }

  subscribeYieldPositions (addresses: string[]) {
    return liveQuery(
      () => this.getByAddress(addresses)
    );
  }
}
