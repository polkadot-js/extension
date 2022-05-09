// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';
import {UNIQUE_SCAN_ENDPOINT} from "@polkadot/extension-koni-base/api/nft/config";

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

  private async getNftByAccount (address: string) {
    return await fetch(this.endpoint, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(UniqueNftApiV2.parseNftRequest(address))
    })
      .then((res) => res.json()) as NftData;
  }

  public async handleNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void) {
    try {
      await Promise.all(this.addresses.map(async (address) => {
        await this.getNftByAccount(address);
      }));
    } catch (e) {
      console.error(`Failed to fetch ${this.chain} nft`, e);
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
