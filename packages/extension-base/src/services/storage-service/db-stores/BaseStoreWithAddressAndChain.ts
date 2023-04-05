// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DefaultDocWithAddressAndChain } from '@subwallet/extension-base/services/storage-service/databases';
import BaseStore from '@subwallet/extension-base/services/storage-service/db-stores/BaseStore';

export default class BaseStoreWithAddressAndChain<T extends DefaultDocWithAddressAndChain> extends BaseStore<T> {
  public convertToJsonObject (items: T[]): Record<string, T> {
    return items.reduce((a, v) => ({ ...a, [v.chain]: v }), {});
  }

  public removeAllByAddress (address: string) {
    return this.table.where('address').equalsIgnoreCase(address).delete();
  }

  async getDataByAddressAsObject (address: string) {
    const data = await this.table.where('address').equals(address).toArray();

    return this.convertToJsonObject(data);
  }
}
