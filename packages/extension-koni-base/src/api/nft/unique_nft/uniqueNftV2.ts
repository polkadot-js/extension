// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
import fetch from 'cross-fetch';

import { NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { UNIQUE_SCAN_ENDPOINT } from '@polkadot/extension-koni-base/api/nft/config';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';

interface NftData {
  collection_id: number;
  id: number;
  data: Record<string, any>
}

export class UniqueNftApiV2 extends BaseNftApi {
  endpoint = UNIQUE_SCAN_ENDPOINT;

  // eslint-disable-next-line no-useless-constructor
  constructor () {
    super();
  }

  private static parseNftRequest (address: string) {
    return {
      // eslint-disable-next-line
      query: `query MyQuery { tokens(where: {owner: {_eq: \"${address}\"}}) { collection_id id data } }`
    };
  }

  private static parseNftCollectionRequest (address: string) {
    return {
      // eslint-disable-next-line
      query: `query MyQuery { tokens(where: {owner: {_eq: \"${address}\"}}) { collection_id id data } }`
    };
  }

  private async getNftByAccount (address: string) {
    const resp = await fetch(this.endpoint, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(UniqueNftApiV2.parseNftRequest(address))
    });

    const result = await resp.json() as Record<string, any>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return result?.data?.tokens as NftData[];
  }

  private async

  public async handleNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void) {
    let allNfts: Record<string | number, any>[] = [];

    try {
      await Promise.all(this.addresses.map(async (address) => {
        const nfts = await this.getNftByAccount(address);

        allNfts = allNfts.concat(nfts);
      }));

      console.log('allNfts', allNfts);
    } catch (e) {
      console.error(`Failed to fetch ${this.chain as string} nft`, e);
    }
  }

  public async fetchNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void): Promise<number> {
    try {
      await this.handleNfts(updateItem, updateCollection, updateReady);
    } catch (e) {
      return 0;
    }

    return 1;
  }
}
