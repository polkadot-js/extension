// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { VARA_SCAN_ENDPOINT } from '@subwallet/extension-base/koni/api/nft/config';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-base/koni/api/nft/nft';

import { hexAddPrefix, u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

interface NftData {
  collection: {
    id: string;
    name: string;
    description: string;
  };
  id: string;
  mediaUrl: string;
  name: string;
  tokenId: string;
  attribUrl: string[];
  description: string;
}

export class VaraNftApi extends BaseNftApi {
  endpoint = VARA_SCAN_ENDPOINT;

  // eslint-disable-next-line no-useless-constructor
  constructor (chain: string, addresses: string[]) {
    super(chain, undefined, addresses);
  }

  private static parseNftRequest (publicKey: string) {
    return {
      // eslint-disable-next-line
      query: `
        query MyQuery {
          accountById(id: "${publicKey}") {
            id
            nfts {
              id
              mediaUrl
              name
              tokenId
              attribUrl
              description
              collection {
                id
                name
                description
              }
            }
          }
        }
      `
    };
  }

  // private static parseNftCollectionRequest (collectionId: string) {
  //   return {
  //     // eslint-disable-next-line
  //     query: `query MyQuery { collections(where: {collection_id: {_eq: \"${collectionId}\"}}) { collection_id name } }`
  //   };
  // }

  private async getNftByAccount (address: string) {
    const publicKey = hexAddPrefix(u8aToHex(decodeAddress(address)));

    const resp = await fetch(this.endpoint, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(VaraNftApi.parseNftRequest(publicKey))
    });

    const result = await resp.json() as Record<string, any>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return result?.data?.accountById?.nfts as NftData[];
  }

  public async handleNfts (params: HandleNftParams) {
    try {
      await Promise.all(this.addresses.map(async (address) => {
        const nfts = await this.getNftByAccount(address);

        if (nfts) {
          for (const nft of nfts) {
            const parsedNft: NftItem = {
              id: nft.tokenId,
              chain: this.chain,
              owner: address,
              name: nft.name,
              image: this.parseUrl(nft.mediaUrl),
              description: nft.description,
              collectionId: nft.collection.id
            };

            const parsedCollection: NftCollection = {
              collectionId: nft.collection.id,
              chain: this.chain,
              collectionName: nft.collection.name
            };

            params.updateItem(this.chain, parsedNft, address);
            params.updateCollection(this.chain, parsedCollection);
          }
        }
      }));
    } catch (e) {
      console.error(`Failed to fetch ${this.chain} nft`, e);
    }
  }

  public async fetchNfts (params: HandleNftParams): Promise<number> {
    try {
      await this.handleNfts(params);
    } catch (e) {
      return 0;
    }

    return 1;
  }
}
