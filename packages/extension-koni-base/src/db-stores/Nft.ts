// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { liveQuery } from 'dexie';

import { ALL_ACCOUNT_KEY } from '../constants';
import { INft } from '../databases';
import BaseStoreWithAddress from '../db-stores/BaseStoreWithAddress';

export default class NftStore extends BaseStoreWithAddress<INft> {
  getNft (address: string, chainHashs: string[] = []) {
    const conditions: Record<string, string> = {};

    if (address && address !== ALL_ACCOUNT_KEY) {
      conditions.address = address;
    }

    if (Object.keys(conditions).length) {
      return this.table.where(conditions).and((item) => !chainHashs.length || chainHashs.includes(item.chainHash)).toArray();
    }

    return this.table.filter((item) => !chainHashs.length || chainHashs.includes(item.chainHash)).toArray();
  }

  subscribeNft (address: string, chainHashs: string[] = []) {
    return liveQuery(
      () => this.getNft(address, chainHashs)
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
}
