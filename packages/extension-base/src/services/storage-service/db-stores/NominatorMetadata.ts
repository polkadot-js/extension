// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominatorMetadata } from '@subwallet/extension-base/background/KoniTypes';
import BaseStoreWithAddressAndChain from '@subwallet/extension-base/services/storage-service/db-stores/BaseStoreWithAddressAndChain';
import { liveQuery } from 'dexie';

export default class NominatorMetadataStore extends BaseStoreWithAddressAndChain<NominatorMetadata> {
  async getAll () {
    return this.table.toArray();
  }

  subscribeByAddresses (addresses: string[]) {
    return liveQuery(
      () => this.getByAddress(addresses)
    );
  }

  subscribeAll () {
    return liveQuery(
      () => this.getAll()
    );
  }

  getByAddress (addresses: string[]) {
    return this.table.where('address').anyOfIgnoreCase(addresses).toArray();
  }

  async removeByAddress (address: string) {
    return this.table.where('address').anyOfIgnoreCase(address).delete();
  }
}
