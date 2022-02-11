// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import { NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { parseIpfsLink } from '@polkadot/extension-koni-base/utils/utils';

import { wsProvider } from '../../connector';
import networks from '../../endpoints';
import { deserializeNft } from './protobuf';
import unique_types from './runtime_types';

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

function hexToStr (buf: string): string {
  let str = '';
  let hexStart = buf.indexOf('0x');

  if (hexStart < 0) hexStart = 0;
  else hexStart = 2;

  for (let i = hexStart, strLen = buf.length; i < strLen; i += 2) {
    const ch = buf[i] + buf[i + 1];
    const num = parseInt(ch, 16);

    if (num != 0) str += String.fromCharCode(num);
    else break;
  }

  return str;
}

function utf16ToString (uint16_array: Array<number>): string {
  let str = '';

  for (let i = 0; i < uint16_array.length; i++) { str += String.fromCharCode(uint16_array[i]); }

  return str;
}

function hexToUTF16 (hex: string): Uint8Array {
  const buf = [];
  let hexStart = hex.indexOf('0x');

  if (hexStart < 0) hexStart = 0;
  else hexStart = 2;

  for (let i = hexStart, strLen = hex.length; i < strLen; i += 2) {
    const ch = hex[i] + hex[i + 1];
    const num = parseInt(ch, 16);

    buf.push(num);
  }

  return new Uint8Array(buf);
}

interface NftIdList {
  collectionId: number,
  nfts: string[]
}

interface TokenData {
  owner: string,
  prefix: string,
  collectionName: string,
  collectionDescription: string,
  properties: any,
  image: string,
}

export default class UniqueNftApi {
  api: ApiPromise | null = null;

  constructor () {
  }

  public async connect () {
    if (unique_types.types) { this.api = await wsProvider(networks.uniqueNft, unique_types.types[0]?.types); }
  }

  public async disconnect () {
    if (this.api) { await this.api.disconnect(); }
  }

  public async getCollectionCount (): Promise<number> {
    if (!this.api) return 0;

    return (await this.api.query.nft.createdCollectionCount()) as unknown as number;
  }

  /**
    * Retrieve address of NFTs
    *
    * @param collectionId: Id of the collection
    * @param owner: address of account
    * @returns the array of NFTs
    */
  public async getAddressTokens (collectionId: number, owner: string): Promise<any> {
    if (!this.api) return;

    return (await this.api.query.nft.addressTokens(collectionId, owner)).toJSON();
  }

  /**
    * Retrieve NFT image URL according to the collection offchain schema
    *
    * @param collectionId: Id of the collection
    * @param tokenId: Token ID
    * @returns the URL of the token image
    */
  public async getNftImageUrl (collectionId: number, tokenId: string) {
    if (!this.api) return;
    const collection = (await this.api.query.nft.collectionById(collectionId)).toJSON() as unknown as Collection;

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

    console.log(`NFT ${collectionId}-${tokenId} Image URL: `, url);

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
    if (!this.api) return;
    const collection = (await this.api.query.nft.collectionById(collectionId)).toJSON() as unknown as Collection;
    const schemaRead = hexToStr(collection.ConstOnChainSchema);
    const token = (await this.api.query.nft.nftItemList(collectionId, tokenId)).toJSON() as unknown as Token;
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

    const tokenData = {
      owner: token.Owner,
      prefix: hexToStr(collection.TokenPrefix),
      collectionName: utf16ToString(collection.Name),
      collectionDescription: utf16ToString(collection.Description),
      properties: properties,
      image: url
    };

    console.log(`NFT ${collectionId}-${tokenId} data: `, tokenData);

    return tokenData;
  }
}

export const handleUniqueNfts = async (account: string): Promise<any> => {
  if (!account) return [];

  const api = new UniqueNftApi();

  await api.connect();

  const collectionCount = await api.getCollectionCount();

  const data: NftIdList[] = [];
  const allCollections: NftCollection[] = [];

  const addressTokenDict: any[] = [];

  for (let i = 0; i < collectionCount; i++) {
    addressTokenDict.push({ i, account });
  }

  await Promise.all(addressTokenDict.map(async (item) => {
    const rs = await api.getAddressTokens(item.i, item.account);

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
      // Get token image URL
      const _imageUrl = api.getNftImageUrl(collectionId, tokenId) as unknown as string;
      // Get token data
      const _tokenData = api.getNftData(collectionId, tokenId, 'en') as unknown as TokenData;

      const [imageUrl, tokenData] = await Promise.all([_imageUrl, _tokenData]);

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

    allCollections.push({
      collectionId: collectionId.toString(),
      collectionName: collectionName,
      image: collectionImage,
      nftItems: nftItems
    } as NftCollection);
  }

  await api.disconnect();

  return { total, allCollections };
};
