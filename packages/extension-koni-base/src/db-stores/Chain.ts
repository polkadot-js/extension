// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { IChain } from '@subwallet/extension-koni-base/databases';
import BaseStore from '@subwallet/extension-koni-base/db-stores/BaseStore';

export default class ChainStore extends BaseStore<IChain> {
  async getAll () {
    return this.table.toArray();
  }

  async removeChains (chains: string[]) {
    return this.table.where('slug').anyOfIgnoreCase(chains).delete();
  }
}
