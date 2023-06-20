// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { IMantaPayLedger } from '@subwallet/extension-base/services/storage-service/databases';
import BaseStore from '@subwallet/extension-base/services/storage-service/db-stores/BaseStore';
import { liveQuery } from 'dexie';

export default class MantaPayStore extends BaseStore<IMantaPayLedger> {
  async getAll () {
    return this.table.toArray();
  }

  subscribeMantaPayConfig (chain: string) {
    return liveQuery(
      () => this.table.where({ chain }).toArray()
    );
  }

  getConfig (chain: string) {
    return this.table.where({ chain }).toArray();
  }
}
