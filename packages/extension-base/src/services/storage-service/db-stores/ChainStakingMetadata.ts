// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import BaseStoreWithChain from '@subwallet/extension-base/services/storage-service/db-stores/BaseStoreWithChain';
import { liveQuery } from 'dexie';

export default class ChainStakingMetadataStore extends BaseStoreWithChain<ChainStakingMetadata> {
  async getAll () {
    return this.table.toArray();
  }

  subscribeByChain (chains: string[]) {
    return liveQuery(
      () => this.getByChains(chains)
    );
  }

  getByChains (chains: string[]) {
    if (chains.length === 0) {
      return this.getAll();
    }

    return this.table.where('chain').anyOfIgnoreCase(chains).toArray();
  }

  getByChainAndType (chain: string, type = StakingType.NOMINATED) {
    return this.table.where({
      chain,
      type
    }).first();
  }

  async removeByChains (chains: string[]) {
    return this.table.where('chain').anyOfIgnoreCase(chains).delete();
  }

  updateByChainAndType (chain: string, type = StakingType.NOMINATED, changes: Record<string, unknown>) {
    return this.table.update([chain, type], changes);
  }
}
