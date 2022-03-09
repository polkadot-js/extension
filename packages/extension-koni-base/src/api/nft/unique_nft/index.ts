// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';
import { hexToStr, hexToUTF16, parseIpfsLink, utf16ToString } from '@polkadot/extension-koni-base/utils/utils';

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

export default class UniqueNftApi extends BaseNftApi {
  // eslint-disable-next-line no-useless-constructor
  constructor (api: ApiProps, addresses: string[], chain?: string) {
    super(api, addresses, chain);
  }

  public async getCollectionCount (): Promise<number> {
    if (!this.dotSamaApi) return 0;

    return (await this.dotSamaApi.api.query.nft.createdCollectionCount()) as unknown as number;
  }

  /**
    * Retrieve address of NFTs
    *
    * @param collectionId: Id of the collection
    * @param owner: address of account
    * @returns the array of NFTs
    */
  public async getAddressTokens (collectionId: number, owner: string): Promise<any> {
    if (!this.dotSamaApi) return;

    return (await this.dotSamaApi.api.query.nft.addressTokens(collectionId, owner)).toJSON();
  }

  /**
   * Retrieve NFT image URL according to the collection offchain schema
   *
   * @param collection
   * @param tokenId: Token ID
   * @returns the URL of the token image
   */
  public getNftImageUrl (collection: Collection, tokenId: string) {
    if (!this.dotSamaApi) return;

    let url = '';

    // Get schema version and off-chain schema
    if (!collection) return;
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
    if (!this.dotSamaApi) return;
    const schemaRead = hexToStr(collection.ConstOnChainSchema);
    const token = (await this.dotSamaApi.api.query.nft.nftItemList(collectionId, tokenId)).toJSON() as unknown as Token;
    const nftProps = hexToUTF16(token.ConstData);
    const properties = deserializeNft(schemaRead, nftProps, locale);

    let url = '';

    // Get schema version and off-chain schema
    if (!collection) return;
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

  public async handleNfts () {
    const start = performance.now();

    const collectionCount = await this.getCollectionCount();
    const allCollections: NftCollection[] = [];
    const addressTokenDict: any[] = [];
    let allNftId: string[] = [];
    const nftMap: Record<string, number> = {};
    const collectionMap: Record<string, Collection> = {};
    const allCollectionId: number[] = [];
    const collectionMeta: Record<string, any> = {};
    const allNft: Record<string, NftItem[]> = {};

    for (let i = 0; i < collectionCount; i++) {
      for (const address of this.addresses) {
        addressTokenDict.push({ i, account: address });
      }
    }

    await Promise.all(addressTokenDict.map(async (item: Record<string, string | number>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const nftIds = await this.getAddressTokens(item.i as number, item.account as string);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (nftIds && nftIds.length > 0) {
        allNftId = allNftId.concat(nftIds as string[]);
        if (!allCollectionId.includes(item.i as number)) allCollectionId.push(item.i as number);

        for (const nftId of nftIds) {
          nftMap[nftId as string] = item.i as number;
        }
      }
    }));

    await Promise.all(allCollectionId.map(async (collectionId) => {
      // @ts-ignore
      collectionMap[collectionId.toString()] = (await this.dotSamaApi.api.query.nft.collectionById(collectionId)).toJSON() as unknown as Collection;
    }));

    let total = 0;

    await Promise.all(allNftId.map(async (nft) => {
      const collectionId = nftMap[nft];
      const tokenId = nft;
      const _collection = collectionMap[collectionId];
      const imageUrl = this.getNftImageUrl(_collection, tokenId);

      const tokenData = await this.getNftData(_collection, tokenId, 'en', collectionId);

      if (tokenData && imageUrl) {
        if (!(collectionId in collectionMeta)) {
          collectionMeta[collectionId] = {
            collectionName: tokenData.collectionName,
            collectionImage: parseIpfsLink(tokenData.image)
          };
        }

        total += 1;

        if (collectionId in allNft) {
          allNft[collectionId].push({
            id: tokenId,
            name: tokenData.prefix + '#' + tokenId,
            image: parseIpfsLink(imageUrl),
            external_url: `https://unqnft.io/#/market/token-details?collectionId=${collectionId}&tokenId=${tokenId}`,
            collectionId: collectionId.toString(),
            properties: tokenData.properties,
            rarity: '',
            chain: 'uniqueNft'
          } as NftItem);
        } else {
          allNft[collectionId] = [{
            id: tokenId,
            name: tokenData.prefix + '#' + tokenId,
            image: parseIpfsLink(imageUrl),
            external_url: `https://unqnft.io/#/market/token-details?collectionId=${collectionId}&tokenId=${tokenId}`,
            collectionId: collectionId.toString(),
            properties: tokenData.properties,
            rarity: '',
            chain: 'uniqueNft'
          } as NftItem];
        }
      }
    }));

    Object.keys(collectionMap).forEach((collectionId) => {
      const collectionMetadata = collectionMeta[collectionId] as Record<string, string>;

      allCollections.push({
        collectionId: collectionId,
        collectionName: collectionMetadata.collectionName,
        image: collectionMetadata.collectionImage,
        nftItems: allNft[collectionId]
      } as NftCollection);
    });

    this.total = total;
    this.data = allCollections;

    console.log(`unique took ${performance.now() - start}ms`);

    console.log(`Fetched ${total} nfts from unique`);
  }
}
