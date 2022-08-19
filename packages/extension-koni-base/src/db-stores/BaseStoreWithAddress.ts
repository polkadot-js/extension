// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DefaultAddressDoc } from '../databases';
import BaseStoreWithChain from './BaseStoreWithChain';

export default class BaseStoreWithAddress<T extends DefaultAddressDoc> extends BaseStoreWithChain<T> {
  public removeAllByAddress (address: string, chain?: string) {
    const conditions = { address } as T;

    if (chain) {
      conditions.chain = chain;
    }

    return this.table.where(conditions).delete();
  }

  async getDataByAddressAsObject (address: string) {
    const data = await this.table.where('address').equals(address).toArray();

    return this.convertToJsonObject(data);
  }
}
