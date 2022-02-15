// [object Object]
// SPDX-License-Identifier: Apache-2.0

import fetch from 'node-fetch';

import {ApiProps, NftCollection, NftItem} from '@polkadot/extension-base/background/KoniTypes';
import {CLOUDFLARE_SERVER} from '@polkadot/extension-koni-base/api/nft/config';
import {isUrl} from '@polkadot/extension-koni-base/utils/utils';
import {BaseNftApi} from "@polkadot/extension-koni-base/api/nft/nft";

interface AssetId {
  classId: string | number,
  tokenId: string | number
}

interface Collection {
  name: string,
  description: string,
  image: string
}

interface Token {
  metadata: string | undefined,
  owner: string,
  data: Record<string, any>
}

export class KaruraNftApi extends BaseNftApi {

  constructor (api: ApiProps, addresses: string[], chain?: string) {
    super(api, addresses, chain);
  }

  // public async connect () {
  //   this.api = await wsProvider(networks.karura);
  // }
  //
  // public async disconnect () {
  //   if (this.api) { await this.api.disconnect(); }
  // }

  override parseUrl(input: string): string | undefined {
    if (!input || input.length === 0) return undefined;

    if (isUrl(input)) return input;

    if (!input.includes('ipfs://')) { return CLOUDFLARE_SERVER + input; }

    return CLOUDFLARE_SERVER + input.split('ipfs://')[1];
  }

  /**
   * Retrieve id of NFTs
   *
   * @returns the array of NFT Ids
   * @param address
   */
  private async getNfts (address: string): Promise<AssetId[]> {
    if (!this.dotSamaApi) return [];
    const accountAssets = await this.dotSamaApi.api.query.ormlNFT.tokensByOwner.keys(address);
    const assetIds: AssetId[] = [];

    for (const key of accountAssets) {
      const data = key.toHuman() as string[];

      assetIds.push({ classId: data[1], tokenId: this.parseTokenId(data[2]) });
    }

    return assetIds;
  }

  private async getCollectionDetails (collectionId: number | string): Promise<any> {
    if (!this.dotSamaApi) return null;

    const metadataCollection = (await this.dotSamaApi.api.query.ormlNFT.classes(collectionId)).toHuman() as any;

    if (!metadataCollection?.metadata) return null;

    const data = await getKaruraMetadata(metadataCollection?.metadata) as unknown as Collection;

    return { ...data, image: this.parseUrl(data.image) };
  }

  private async getTokenDetails (assetId: AssetId): Promise<any> {
    if (!this.dotSamaApi) return null;
    return (await this.dotSamaApi.api.query.ormlNFT.tokens(assetId.classId, assetId.tokenId)).toHuman() as unknown as Token;
  }

  public async handleNfts () {
    const allCollections: NftCollection[] = [];
    const assetIds = await this.getNfts(this.addresses[0]);

    if (!assetIds || assetIds.length === 0) {
      this.total = 0;
      this.data = allCollections;

      return;
    }

    assetIds.map((asset) => {
      const newCollection = {
        collectionId: asset.classId.toString(),
        nftItems: []
      } as NftCollection;

      if (!allCollections.some((collection) => collection.collectionId === asset.classId.toString())) { allCollections.push(newCollection); }
    });

    const allItems: NftItem[] = [];
    const collectionMetaDict: Record<any, any> = {};

    await Promise.all(assetIds.map(async (assetId) => {
      const tokenInfo = await this.getTokenDetails(assetId);
      let collectionMeta: any;

      if (!(assetId.classId in collectionMetaDict)) {
        collectionMeta = await this.getCollectionDetails(assetId.classId as number);
        collectionMetaDict[assetId.classId] = collectionMeta;
      }

      const parsedNft = {
        id: assetId.tokenId.toString(),
        name: tokenInfo?.name,
        description: tokenInfo?.description,
        image: tokenInfo && tokenInfo.image ? this.parseUrl(tokenInfo?.image) : collectionMeta?.image,
        collectionId: assetId.classId.toString()
      } as NftItem;

      allItems.push(parsedNft);
    }));

    for (const collection of allCollections) {
      const collectionMeta = collectionMetaDict[collection.collectionId];

      if (collectionMeta) {
        collection.collectionName = collectionMeta?.name;
        collection.image = collectionMeta.image;
      }

      for (const item of allItems) {
        if (collection.collectionId === item.collectionId) {
          collection.nftItems.push(item);
        }
      }
    }

    this.total = assetIds.length;
    this.data = allCollections;
  }
}

const getKaruraMetadata = (metadata_url: string) => {
  let url: string | null = metadata_url;

  if (!metadata_url) return null;
  url = CLOUDFLARE_SERVER + metadata_url + '/metadata.json';

  return fetch(url, {
    method: 'GET',
    headers : {'Content-Type': 'application/json'}
  })
    .then((res) => res.json());
};

// Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr
// export const handleKaruraNfts = async (account: string): Promise<any> => {
//   const allCollections: NftCollection[] = [];
//   const api = new KaruraNftApi();
//
//   await api.connect();
//   const assetIds = await api.getNfts(account);
//
//   if (!assetIds || assetIds.length === 0) {
//     return { total: 0, allCollections };
//   }
//
//   assetIds.map((asset) => {
//     const newCollection = {
//       collectionId: asset.classId.toString(),
//       nftItems: []
//     } as NftCollection;
//
//     if (!allCollections.some((collection) => collection.collectionId === asset.classId.toString())) { allCollections.push(newCollection); }
//   });
//
//   const allItems: NftItem[] = [];
//   const collectionMetaDict: Record<any, any> = {};
//
//   await Promise.all(assetIds.map(async (assetId) => {
//     const tokenInfo = await api.getTokenDetails(assetId);
//     let collectionMeta: any;
//
//     if (!(assetId.classId in collectionMetaDict)) {
//       collectionMeta = await api.getCollectionDetails(assetId.classId as number);
//       collectionMetaDict[assetId.classId] = collectionMeta;
//     }
//
//     const parsedNft = {
//       id: assetId.tokenId.toString(),
//       name: tokenInfo?.name,
//       description: tokenInfo?.description,
//       image: tokenInfo && tokenInfo.image ? parseKaruraIpfsLink(tokenInfo?.image) : collectionMeta?.image,
//       collectionId: assetId.classId.toString()
//     } as NftItem;
//
//     allItems.push(parsedNft);
//   }));
//
//   for (const collection of allCollections) {
//     const collectionMeta = collectionMetaDict[collection.collectionId];
//
//     if (collectionMeta) {
//       collection.collectionName = collectionMeta?.name;
//       collection.image = collectionMeta.image;
//     }
//
//     for (const item of allItems) {
//       if (collection.collectionId === item.collectionId) {
//         collection.nftItems.push(item);
//       }
//     }
//   }
//
//   await api.disconnect();
//
//   return { total: assetIds.length, allCollections };
// };
