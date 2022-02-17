// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ApiProps, NftCollection, NftItem} from '@polkadot/extension-base/background/KoniTypes';
import {hexToStr, hexToUTF16, parseIpfsLink, utf16ToString} from '@polkadot/extension-koni-base/utils/utils';

import {deserializeNft} from './protobuf';
import {BaseNftApi} from "@polkadot/extension-koni-base/api/nft/nft";

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

interface NftIdList {
  collectionId: number,
  nfts: string[]
}

export default class UniqueNftApi extends BaseNftApi {

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
    * @param collectionId: Id of the collection
    * @param tokenId: Token ID
    * @returns the URL of the token image
    */
  public async getNftImageUrl (collectionId: number, tokenId: string) {
    if (!this.dotSamaApi) return;
    const collection = (await this.dotSamaApi.api.query.nft.collectionById(collectionId)).toJSON() as unknown as Collection;

    let url = '';

    // Get schema version and off-chain schema
    if (!collection) return;
    const schemaVersion = collection.SchemaVersion;
    const offchainSchema = hexToStr(collection.OffchainSchema);

    if (schemaVersion == 'ImageURL') {
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
    * @param collectionId: Id of the collection
    * @param tokenId: Token ID
    * @param locale: Output locale (default is "en")
    * @returns tokenData: Token data object
    */
  public async getNftData (collectionId: number, tokenId: string, locale = 'en') {
    if (!this.dotSamaApi) return;
    const collection = (await this.dotSamaApi.api.query.nft.collectionById(collectionId)).toJSON() as unknown as Collection;
    const schemaRead = hexToStr(collection.ConstOnChainSchema);
    const token = (await this.dotSamaApi.api.query.nft.nftItemList(collectionId, tokenId)).toJSON() as unknown as Token;
    const nftProps = hexToUTF16(token.ConstData);
    const properties = deserializeNft(schemaRead, nftProps, locale);

    let url = '';

    // Get schema version and off-chain schema
    if (!collection) return;
    const schemaVersion = collection.SchemaVersion;
    const offchainSchema = hexToStr(collection.OffchainSchema);

    if (schemaVersion == 'ImageURL') {
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
    const collectionCount = await this.getCollectionCount();

    const data: NftIdList[] = [];
    const allCollections: NftCollection[] = [];

    const addressTokenDict: any[] = [];
    for (let i = 0; i < collectionCount; i++) {
      for (let address of this.addresses) {
        addressTokenDict.push({ i, account: address });
      }
    }

    await Promise.all(addressTokenDict.map(async (item) => {
      const rs = await this.getAddressTokens(item.i, item.account);

      if (rs && rs.length > 0) { data.push({ collectionId: item.i, nfts: rs }); }
    }));

    let total = 0;

    for (let j = 0; j < data.length; j++) {
      const nftItems: NftItem[] = [];
      const collectionId = data[j].collectionId;
      const nfts = data[j].nfts;
      let collectionName = '';
      let collectionImage = '';

      total += nfts.length;

      for (let i = 0; i < nfts.length; i++) {
        const tokenId = nfts[i];
        const [imageUrl, tokenData] = await Promise.all([
          this.getNftImageUrl(collectionId, tokenId),
          this.getNftData(collectionId, tokenId, 'en')]);

        if (tokenData && imageUrl) {
          collectionName = tokenData.collectionName;
          collectionImage = parseIpfsLink(tokenData.image);
          const tokenDetail: NftItem = {
            id: tokenId,
            name: tokenData.prefix + '#' + tokenId,
            image: parseIpfsLink(imageUrl),
            external_url: `https://unqnft.io/#/market/token-details?collectionId=${collectionId}&tokenId=${tokenId}`,
            collectionId: collectionId.toString(),
            properties: tokenData.properties,
            rarity: ''
          };

          nftItems.push(tokenDetail);
        }
      }

      allCollections.push({
        collectionId: collectionId.toString(),
        collectionName: collectionName,
        image: collectionImage,
        nftItems: nftItems
      } as NftCollection);
    }

    this.total = total;
    this.data = allCollections;
  }
}
