// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseStore from '@subwallet/extension-base/services/storage-service/db-stores/BaseStore';

import { DefaultAddressDoc } from '../databases';

export default class BaseStoreWithAddress<T extends DefaultAddressDoc> extends BaseStore<T> {
  public removeAllByAddress (address: string) {
    const conditions = { address } as T;

    return this.table.where(conditions).delete();
  }

  // async getDataByAddressAsObject (address: string) {
  //   const data = await this.table.where('address').equals(address).toArray();
  //
  //   console.log('from store', data);
  //
  //   return {};
  // }
}
