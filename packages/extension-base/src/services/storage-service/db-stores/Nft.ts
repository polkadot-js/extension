// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftItem } from '@subwallet/extension-base/background/KoniTypes';
import BaseStoreWithAddressAndChain from '@subwallet/extension-base/services/storage-service/db-stores/BaseStoreWithAddressAndChain';
import { liveQuery } from 'dexie';

import { INft } from '../databases';

export default class NftStore extends BaseStoreWithAddressAndChain<INft> {
  getNft (addresses: string[], chainList: string[] = []) {
    if (addresses.length) {
      return this.table.where('address').anyOfIgnoreCase(addresses).and((item) => chainList && chainList.includes(item.chain)).toArray();
    }

    // return this.table.filter((item) => !chainHashes.length || chainHashes.includes(item.chainHash)).toArray();
    return this.table.filter((item) => chainList && chainList.includes(item.chain)).toArray();
  }

  subscribeNft (addresses: string[], chainList: string[] = []) {
    return liveQuery(
      () => this.getNft(addresses, chainList)
    );
  }

  cleanUpNfts (chain: string, address: string, collectionIds: string[], nftIds: string[]) {
    return this.table.where({
      address,
      chain
    }).and((nft) => collectionIds.includes(nft.collectionId) && !nftIds.includes(nft.id)).delete();
  }

  deleteNftsByChainAndOwner (chain: string, address: string, collectionIds: string[]) {
    return this.table.where({
      address,
      chain
    }).and((nft) => collectionIds.includes(nft.collectionId)).delete();
  }

  deleteNftByAddress (addresses: string[]) {
    return this.table.where('address').anyOfIgnoreCase(addresses).delete();
  }

  deleteNftItem (chain: string, addresses: string[], nftItem: NftItem) {
    return this.table.where('address').anyOfIgnoreCase(addresses).filter((storedItem) => storedItem.chain === chain &&
      storedItem.collectionId === nftItem.collectionId &&
      storedItem.id === nftItem.id).delete();
  }

  deleteNftsByCollection (chain: string, collectionId: string) {
    return this.table.where({
      chain,
      collectionId
    }).delete();
  }

  removeNfts (chain: string, address: string, collectionId: string, nftIds: string[]) {
    return this.table.where({
      chain,
      address,
      collectionId
    }).filter((item) => nftIds.includes(item.id || '')).delete();
  }

  removeNftsByAddress (addresses: string[]) {
    return this.table.where('address').anyOfIgnoreCase(addresses).delete();
  }

  checkNftsByChainAndCollection (chain: string, filterFunc: (x: INft) => boolean, collectionId?: string) {
    const data = collectionId ? this.table.where({ chain, collectionId }) : this.table.where({ chain });

    return data.filter((item) => filterFunc(item)).count();
  }

  checkNftExist (filterFunc: (x: INft) => boolean) {
    return this.table.filter(filterFunc).count();
  }

  // reformatCollectionIds (items: INft[]) {
  //   return items.map((item) => {
  //     item.collectionId = item.collectionId?.toLowerCase();

  //     return item;
  //   });
  // }
}
