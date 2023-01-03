// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { liveQuery } from 'dexie';

import { INftCollection } from '../databases';
import BaseStoreWithChain from './BaseStoreWithChain';

export default class NftCollectionStore extends BaseStoreWithChain<INftCollection> {
  subscribeNftCollection (chainHashes?: string[]) {
    return liveQuery(() => this.getNftCollection(chainHashes));
  }

  getNftCollection (chainHashes?: string[]) {
    if (chainHashes && chainHashes.length > 0) {
      return this.table.where('chainHash').anyOfIgnoreCase(chainHashes).toArray();
    }

    return this.table.toArray();
  }
}
