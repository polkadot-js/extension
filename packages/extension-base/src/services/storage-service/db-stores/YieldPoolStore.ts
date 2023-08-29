// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo } from '@subwallet/extension-base/background/KoniTypes';
import BaseStore from '@subwallet/extension-base/services/storage-service/db-stores/BaseStore';
import { liveQuery } from 'dexie';

export default class YieldPoolStore extends BaseStore<YieldPoolInfo> {
  async getAll () {
    return this.table.toArray();
  }

  async getByChains (chains: string[]) {
    if (chains.length === 0) {
      return this.getAll();
    }

    return this.table.where('chain').anyOfIgnoreCase(chains).toArray();
  }

  subscribeYieldPoolInfo (chains: string[]) {
    return liveQuery(
      () => this.getByChains(chains)
    );
  }
}
