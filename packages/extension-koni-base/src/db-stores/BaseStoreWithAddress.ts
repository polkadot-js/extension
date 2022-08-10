// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DefaultAddressDoc } from '../databases';
import BaseStore from './BaseStore';

export default class BaseStoreWithAddress<T extends DefaultAddressDoc> extends BaseStore<T> {
  public removeAllByAddress (address: string, chain?: string) {
    const conditions = { address } as T;

    if (chain) {
      conditions.chain = chain;
    }

    return this.table.where(conditions).delete();
  }
}
