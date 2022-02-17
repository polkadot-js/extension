// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ApiProps, NftCollection, NftItem} from '@polkadot/extension-base/background/KoniTypes';
import {hexToStr, hexToUTF16, parseIpfsLink, utf16ToString} from '@polkadot/extension-koni-base/utils/utils';

import {deserializeNft} from './protobuf';
import {BaseNftApi} from "@polkadot/extension-koni-base/api/nft/nft";

interface CollectionProperties {
  schemaVersion: string,
  offchainSchema: string,
  constOnChainSchema: string,
  tokenPrefix: string,
  description: number[],
  name: number[]
  owner: string
}

interface NftIdList {
  collectionId: number,
  nfts: number[]
}

export default class QuartzNftApi extends BaseNftApi {

  constructor (api: ApiProps, addresses: string[], chain?: string) {
    super(api, addresses, chain);
  }

  /**
   * Retrieve total number of ever created collections
   *
   * @returns number of created collection
   */
  public async getCreatedCollectionCount (): Promise<number> {
    if (!this.dotSamaApi) return 0;

    // @ts-ignore
    // noinspection TypeScriptValidateJSTypes
    return (await this.dotSamaApi.api.rpc.unique.collectionStats()).toJSON().created;
  }

  /**
    * Retrieve all NFT token IDs owned by the address (within a collection)
    *
    * @param collectionId: Id of the collection
    * @param address: address of account
    * @returns the array of NFT token IDs
    */
  public async getAddressTokens (collectionId: number, address: string): Promise<any> {
    if (!this.dotSamaApi) return;

    // @ts-ignore
    // noinspection TypeScriptValidateJSTypes
    return (await this.dotSamaApi.api.rpc.unique.accountTokens(collectionId, {Substrate: address})).toJSON();
  }

  /**
   * Retrieve collection properties for a given Collection ID
   *
   * @param collectionId: Id of the collection
   * @returns collection properties
   */
  public async getCollectionProperties (collectionId: number) {
    if (!this.dotSamaApi) return;

    // @ts-ignore
    // noinspection TypeScriptValidateJSTypes
    return (await this.dotSamaApi.api.rpc.unique.collectionById(collectionId)).toJSON() as CollectionProperties;
  }


  /**
    * Retrieve NFT image URL according to the collection offchain schema
    *
    * @param collectionProperties: collection properties
    * @param tokenId: Token ID
    * @returns the URL of the token image
    */
  public async getNftImageUrl (collectionProperties: CollectionProperties, tokenId: number) {
    if (!this.dotSamaApi) return;

    let url = '';

    const schemaVersion = collectionProperties.schemaVersion;
    const offchainSchema = hexToStr(collectionProperties.offchainSchema);

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
    * @param collectionProperties: Id of the collection
    * @param collectionId: Collection ID
    * @param tokenId: Token ID
    * @param locale: Output locale (default is "en")
    * @returns tokenData: Token data object
    */
  public async getNftData (collectionProperties: CollectionProperties, collectionId: number, tokenId: number, locale = 'en') {
    if (!this.dotSamaApi) return;

    // @ts-ignore
    // noinspection TypeScriptValidateJSTypes
    const constMetadata = (await this.dotSamaApi.api.rpc.unique.constMetadata(collectionId, tokenId)).toHuman();
    const schemaRead = hexToStr(collectionProperties.constOnChainSchema);
    const nftProps = hexToUTF16(constMetadata);
    const properties = deserializeNft(schemaRead, nftProps, locale);

    let url = '';

    const schemaVersion = collectionProperties.schemaVersion;
    const offchainSchema = hexToStr(collectionProperties.offchainSchema);

    if (schemaVersion == 'ImageURL') {
      // Replace {id} with token ID
      url = offchainSchema;
      url = url.replace('{id}', `${tokenId}`);
    } else {
      // TBD: Query image URL from the RESTful service
    }

    return {
      prefix: hexToStr(collectionProperties.tokenPrefix),
      collectionName: utf16ToString(collectionProperties.name),
      collectionDescription: utf16ToString(collectionProperties.description),
      properties: properties,
      image: url
    };
  }

  public async handleNfts () {
    const collectionCount = await this.getCreatedCollectionCount();

    const data: NftIdList[] = [];
    const allCollections: NftCollection[] = [];

    const addressTokenDict: any[] = [];
    const account = this.addresses[0];
    for (let i = 0; i < collectionCount; i++) {
      addressTokenDict.push({ i, account });
    }

    await Promise.all(addressTokenDict.map(async (item) => {
      const rs = await this.getAddressTokens(item.i, item.account);

      if (rs && rs.length > 0) { data.push({ collectionId: item.i, nfts: rs }); }
    }));

    let total = 0;

    for (let j = 0; j < data.length; j++) {
      const nftItems: NftItem[] = [];
      const collectionId = data[j].collectionId;
      const collectionProperties = await this.getCollectionProperties(collectionId);
      const nfts = data[j].nfts;
      let collectionName = '';
      let collectionImage = '';

      total += nfts.length;

      if (collectionProperties) {
        for (let i = 0; i < nfts.length; i++) {
          const tokenId = nfts[i];
          const nftData = await this.getNftData(collectionProperties, collectionId, tokenId);
          if (nftData) {
            collectionName = nftData.collectionName;
            collectionImage = parseIpfsLink(nftData.image);
            const tokenDetail: NftItem = {
              id: tokenId.toString(),
              name: nftData.prefix + '#' + tokenId,
              image: parseIpfsLink(nftData.image),
              external_url: `https://scan-quartz.unique.network/QUARTZ/tokens/${collectionId}/${tokenId}`,
              collectionId: collectionId.toString(),
              properties: nftData.properties,
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
    }

    this.total = total;
    this.data = allCollections;
  }
}
