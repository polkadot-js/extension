// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { OPAL_SCAN_ENDPOINT, QUARTZ_SCAN_ENDPOINT, UNIQUE_IPFS_GATEWAY, UNIQUE_SCAN_ENDPOINT } from '@subwallet/extension-base/koni/api/nft/config';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-base/koni/api/nft/nft';
import { _NFT_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { baseParseIPFSUrl } from '@subwallet/extension-base/utils';

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

interface NftAttribute {
  trait_type: string;
  value: any;
}

interface NftData {
  collection_id: number;
  collection_name: string;
  collection_description: string;
  collection_cover: string;
  token_id: number;
  token_name: string;
  image: string;
  attributes: NftAttribute[];
}

export class UniqueNftApi extends BaseNftApi {
  constructor (chain: string, addresses: string[]) {
    super(chain, undefined, addresses);
  }

  override parseUrl (input: string): string | undefined {
    return baseParseIPFSUrl(input, UNIQUE_IPFS_GATEWAY);
  }

  private handleProperties (nft: NftData) {
    const propertiesMap: Record<string, any> = {};
    const attRecord = nft.attributes;

    if (attRecord.length) {
      for (const item of attRecord) {
        const attName = item.trait_type;
        const attInfo = item.value as string;

        propertiesMap[attName] = {
          value: attInfo
        };
      }
    }

    return propertiesMap;
  }

  private static parseNftRequest (uniqueAddress: string) {
    return {
      query: `
        query {
            tokens(
                limit: 99999
                offset: 0
                where: { owner: { _eq: "${uniqueAddress}" }, burned: { _eq: "false" }})
            {
                data {
                    collection_id
                    collection_name
                    collection_description
                    collection_cover
                    token_id
                    token_name
                    image
                    attributes
                }
            }
        }
      `
    };
  }

  private async getNftByAccount (address: string) {
    let endpoint = '';
    let uniqueAddress = '';

    // Use exactly endpoint for each network
    if (['unique_network'].includes(this.chain)) {
      endpoint = UNIQUE_SCAN_ENDPOINT;
      uniqueAddress = encodeAddress(decodeAddress(address), 7391);
      // Unique network prefix: 7391
    } else if (['quartz'].includes(this.chain)) {
      endpoint = QUARTZ_SCAN_ENDPOINT;
      uniqueAddress = encodeAddress(decodeAddress(address), 255);
      // Quartz prefix: 255
    } else if (['opal'].includes(this.chain)) {
      endpoint = OPAL_SCAN_ENDPOINT;
      uniqueAddress = address;
      // Opal address: Normal address
    } else if (_NFT_CHAIN_GROUP.unique_evm.includes(this.chain)) {
      endpoint = UNIQUE_SCAN_ENDPOINT;
      uniqueAddress = address.toLowerCase();
    }

    const resp = await fetch(endpoint, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(UniqueNftApi.parseNftRequest(uniqueAddress))
    });

    const result = await resp.json() as Record<string, any>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return result?.data?.tokens?.data as NftData[];
  }

  public async handleNfts (params: HandleNftParams) {
    try {
      await Promise.all(this.addresses.map(async (address) => {
        const nfts = await this.getNftByAccount(address);

        if (nfts) {
          const collectionMap: Record <string, NftCollection> = {};

          for (const nft of nfts) {
            // Handle case rendering image on Quartz Network (Temporary solution)
            if (this.chain === 'quartz' && nft.collection_id.toString() === '141') {
              continue;
            }

            // Handle properties
            const propertiesMap = this.handleProperties(nft);

            // Update Nft information
            const parsedNft: NftItem = {
              id: nft.token_id.toString(),
              chain: this.chain,
              owner: address,
              name: nft.token_name,
              image: this.parseUrl(nft.image),
              description: nft.collection_description,
              collectionId: nft.collection_id.toString(),
              properties: propertiesMap as Record<any, any>
            };

            params.updateItem(this.chain, parsedNft, address);

            // Update Collection information
            if (!collectionMap[nft.collection_id.toString()]) {
              const parsedCollection: NftCollection = {
                collectionId: nft.collection_id.toString(),
                chain: this.chain,
                collectionName: nft.collection_name,
                image: this.parseUrl(nft.collection_cover)
              };

              collectionMap[nft.collection_id.toString()] = parsedCollection;
              params.updateCollection(this.chain, parsedCollection);
            }
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
