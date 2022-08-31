// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { liveQuery } from 'dexie';

import { INft } from '../databases';
import BaseStoreWithAddress from '../db-stores/BaseStoreWithAddress';

export default class NftStore extends BaseStoreWithAddress<INft> {
  getNft (addresses: string[], chainHashs: string[] = []) {
    if (addresses.length) {
      return this.table.where('address').anyOfIgnoreCase(addresses).and((item) => !chainHashs.length || chainHashs.includes(item.chainHash)).toArray().then(this.reformatCollectionIds);
    }

    // return this.table.filter((item) => !chainHashs.length || chainHashs.includes(item.chainHash)).toArray();
    return this.table.filter((item) => !chainHashs.length || chainHashs.includes(item.chainHash)).toArray().then(this.reformatCollectionIds);
  }

  subscribeNft (addresses: string[], chainHashs: string[] = []) {
    return liveQuery(
      () => this.getNft(addresses, chainHashs)
    );
  }

  deleteRemovedNftsFromCollection (chainHash: string, address: string, collection?: string, nftIds: string[] = []) {
    const conditions: Record<string, string> = { chainHash, address };

    if (!collection && nftIds && nftIds.length) {
      return this.logger.warn('Missing collection id');
    }

    if (collection) {
      conditions.collectionId = collection;
    }

    return this.table.where(conditions).and((item) => !nftIds.some((nft) => nft === item.id)).delete();
  }

  deleteNftsFromRemovedCollection (chainHash: string, address: string, collectionIds: string[]) {
    return this.table.where({
      address,
      chainHash
    }).and((colllection) => !collectionIds.some((item) => item === colllection.collectionId));
  }

  deleteNftsByCollection (chainHash: string, collectionId: string) {
    return this.table.where({
      chainHash,
      collectionId
    }).delete();
  }

  removeNfts (chainHash: string, address: string, collectionId: string, nftIds: string[]) {
    return this.table.where({
      chainHash,
      address,
      collectionId
    }).filter((item) => nftIds.includes(item.id || '')).delete();
  }

  reformatCollectionIds (items: INft[]) {
    return items.map((item) => {
      item.collectionId = item.collectionId?.toLowerCase();

      return item;
    });
  }
}
