// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection } from '@subwallet/extension-base/background/KoniTypes';
import { liveQuery } from 'dexie';

import BaseStoreWithChain from './BaseStoreWithChain';

export default class NftCollectionStore extends BaseStoreWithChain<NftCollection> {
  subscribeNftCollection (getChains: () => string[] | undefined) {
    return liveQuery(() => this.getNftCollection(getChains()));
  }

  getNftCollection (chainList?: string[]) {
    if (chainList && chainList.length > 0) {
      return this.table.where('chain').anyOfIgnoreCase(chainList).toArray();
    }

    return this.table.toArray();
  }

  removeCollection (chain: string, collectionId: string) {
    return this.table.where({
      chain,
      collectionId
    }).delete();
  }

  async checkNftByChainOrCollectionId (chain: string, collectionId?: string) {
    if (collectionId) {
      return this.table.where({ chain, collectionId }).count();
    }

    return this.table.where({ chain }).count();
  }
}
