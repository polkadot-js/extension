// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { liveQuery } from 'dexie';

import { INftCollection } from '../databases';
import BaseStoreWithChain from './BaseStoreWithChain';

export default class NftCollectionStore extends BaseStoreWithChain<INftCollection> {
  subscribeNftCollection () {
    return liveQuery(() => this.getNftCollection());
  }

  getNftCollection () {
    return this.table.toArray().then((items) => items.map((item) => {
      item.collectionId = item.collectionId.toLowerCase();

      return item;
    }));
  }
}
