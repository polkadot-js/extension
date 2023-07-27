// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-base/koni/api/nft/nft';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { hexToStr, hexToUTF16, utf16ToString } from '@subwallet/extension-base/utils';

import { deserializeNft } from './protobuf';

interface Collection {
  SchemaVersion: string,
  OffchainSchema: string,
  ConstOnChainSchema: string,
  TokenPrefix: string,
  Description: number[],
  Name: number[]
}

interface Token {
  ConstData: string,
  Owner: string
}

// deprecated
export default class UniqueNftApi extends BaseNftApi {
  // eslint-disable-next-line no-useless-constructor
  constructor (api: _SubstrateApi | null, addresses: string[], chain: string) {
    super(chain, api, addresses);
  }

  public async getCollectionCount (): Promise<number> {
    if (!this.substrateApi) {
      return 0;
    }

    return (await this.substrateApi.api.query.nft.createdCollectionCount()) as unknown as number;
  }

  /**
    * Retrieve address of NFTs
    *
    * @param collectionId: Id of the collection
    * @param owner: address of account
    * @returns the array of NFTs
    */
  public async getAddressTokens (collectionId: number, owner: string): Promise<any> {
    if (!this.substrateApi) {
      return;
    }

    return (await this.substrateApi.api.query.nft.addressTokens(collectionId, owner)).toJSON();
  }

  /**
   * Retrieve NFT image URL according to the collection offchain schema
   *
   * @param collection
   * @param tokenId: Token ID
   * @returns the URL of the token image
   */
  public getNftImageUrl (collection: Collection, tokenId: string) {
    if (!this.substrateApi) {
      return;
    }

    let url = '';

    // Get schema version and off-chain schema
    if (!collection) {
      return;
    }

    const schemaVersion = collection.SchemaVersion;
    const offchainSchema = hexToStr(collection.OffchainSchema);

    if (schemaVersion === 'ImageURL') {
      // Replace {id} with token ID
      url = offchainSchema;
      url = url.replace('{id}', `${tokenId}`);
    } else {
      // TBD: Query image URL from the RESTful service
    }

    return url;
  }

  /**
   * Retrieve and deserialize properties
   *
   *
   * @param collection
   * @param tokenId: Token ID
   * @param locale: Output locale (default is "en")
   * @param collectionId
   * @returns tokenData: Token data object
   */
  public async getNftData (collection: Collection, tokenId: string, locale = 'en', collectionId: number) {
    if (!this.substrateApi) {
      return;
    }

    const schemaRead = hexToStr(collection.ConstOnChainSchema);
    const token = (await this.substrateApi.api.query.nft.nftItemList(collectionId, tokenId)).toJSON() as unknown as Token;
    const nftProps = hexToUTF16(token.ConstData);
    const properties = deserializeNft(schemaRead, nftProps, locale);

    let url = '';

    // Get schema version and off-chain schema
    if (!collection) {
      return;
    }

    const schemaVersion = collection.SchemaVersion;
    const offchainSchema = hexToStr(collection.OffchainSchema);

    if (schemaVersion === 'ImageURL') {
      // Replace {id} with token ID
      url = offchainSchema;
      url = url.replace('{id}', `${tokenId}`);
    } else {
      // TBD: Query image URL from the RESTful service
    }

    return {
      owner: token.Owner,
      prefix: hexToStr(collection.TokenPrefix),
      collectionName: utf16ToString(collection.Name),
      collectionDescription: utf16ToString(collection.Description),
      properties: properties,
      image: url
    };
  }

  public async handleNft (address: string, params: HandleNftParams) {
    // const start = performance.now();

    const collectionCount = await this.getCollectionCount();
    const addressTokenDict: any[] = [];
    const nftMap: Record<string, number> = {};
    const collectionMap: Record<string, Collection> = {};
    const allCollectionId: number[] = [];

    try {
      for (let i = 0; i < collectionCount; i++) {
        for (const addr of [address]) {
          addressTokenDict.push({ i, account: addr });
        }
      }

      await Promise.all(addressTokenDict.map(async (item: Record<string, string | number>) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const nftIds = await this.getAddressTokens(item.i as number, item.account as string);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (nftIds && nftIds.length > 0) {
          if (!allCollectionId.includes(item.i as number)) {
            allCollectionId.push(item.i as number);
          }

          for (const nftId of nftIds) {
            nftMap[nftId as string] = item.i as number;
          }
        }
      }));

      await Promise.all(allCollectionId.map(async (collectionId) => {
        const collectionIdStr = collectionId.toString();

        // @ts-ignore
        const collection = (await this.substrateApi.api.query.nft.collectionById(collectionId)).toJSON() as unknown as Collection;

        collectionMap[collectionIdStr] = collection;
        const nftIds = Object.entries(nftMap).filter((item) => item[1] === collectionId).map((item) => item[0]);

        const parsedCollection: NftCollection = {
          collectionId: collectionIdStr,
          chain: this.chain
        };

        await Promise.all(nftIds.map(async (nft) => {
          const tokenId = nft;
          const imageUrl = this.getNftImageUrl(collection, tokenId);

          const tokenData = await this.getNftData(collection, tokenId, 'en', collectionId);

          if (tokenData && imageUrl) {
            const parsedItem = {
              id: tokenId,
              name: tokenData.prefix + '#' + tokenId,
              image: this.parseUrl(imageUrl),
              externalUrl: `https://unqnft.io/#/market/token-details?collectionId=${collectionId}&tokenId=${tokenId}`,
              collectionId: collectionIdStr,
              properties: tokenData.properties,
              rarity: '',
              chain: this.chain,
              owner: address
            } as NftItem;

            if (!parsedCollection.collectionName) {
              parsedCollection.collectionName = tokenData.collectionName;
              parsedCollection.image = this.parseUrl(tokenData.image);
            }

            params.updateItem(this.chain, parsedItem, address);
            params.updateCollection(this.chain, parsedCollection);
          }
        }));
      }));
    } catch (e) {
      console.error(`${this.chain}`, e);
    }
  }

  public async handleNfts (params: HandleNftParams) {
    await Promise.all(this.addresses.map((address) => this.handleNft(address, params)));
  }

  public async fetchNfts (params: HandleNftParams): Promise<number> {
    try {
      await this.connect();
      await this.handleNfts(params);
    } catch (e) {
      return 0;
    }

    return 1;
  }
}
