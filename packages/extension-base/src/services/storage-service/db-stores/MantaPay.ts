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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
      () => this.table.where({ chain }).filter((data) => data?.key && data?.key.startsWith('config')).toArray()
    );
  }

  getConfig (chain: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
    return this.table.where({ chain }).filter((data) => data?.key && data?.key.startsWith('config')).toArray();
  }

  getFirstConfig (chain: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
    return this.table.where({ chain }).filter((data) => data?.key && data?.key.startsWith('config')).first();
  }

  deleteRecord (key: string) {
    return this.table.where('key').equals(key).delete();
  }
}
