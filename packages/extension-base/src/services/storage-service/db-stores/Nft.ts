// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseStoreWithAddressAndChain from '@subwallet/extension-base/services/storage-service/db-stores/BaseStoreWithAddressAndChain';
import { liveQuery } from 'dexie';

import { INft } from '../databases';

export default class NftStore extends BaseStoreWithAddressAndChain<INft> {
  getNft (addresses: string[], chainList: string[] = []) {
    if (addresses.length) {
      return this.table.where('address').anyOfIgnoreCase(addresses).and((item) => !chainList.length || chainList.includes(item.chain)).toArray();
    }

    // return this.table.filter((item) => !chainHashes.length || chainHashes.includes(item.chainHash)).toArray();
    return this.table.filter((item) => !chainList.length || chainList.includes(item.chain)).toArray();
  }

  subscribeNft (addresses: string[], chainHashes: string[] = []) {
    return liveQuery(
      () => this.getNft(addresses, chainHashes)
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
    }).and((collection) => !collectionIds.some((item) => item === collection.collectionId));
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

  // reformatCollectionIds (items: INft[]) {
  //   return items.map((item) => {
  //     item.collectionId = item.collectionId?.toLowerCase();

  //     return item;
  //   });
  // }
}
