// [object Object]
// SPDX-License-Identifier: Apache-2.0

import fetch from 'node-fetch';

import { ApiPromise } from '@polkadot/api';
import { NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { CLOUDFLARE_SERVER } from '@polkadot/extension-koni-base/api/nft/rmrk_nft/config';
import { isUrl } from '@polkadot/extension-koni-base/utils/utils';

import { wsProvider } from '../../connector';
import networks from '../../endpoints';

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

export default class AcalaNftApi {
  api: ApiPromise| null = null;

  constructor () {
  }

  public async connect () {
    this.api = await wsProvider(networks.acala);
  }

  public async disconnect () {
    if (this.api) { await this.api.disconnect(); }
  }

  /**
   * Retrieve id of NFTs
   *
   * @returns the array of NFT Ids
   * @param address
   */
  public async getNfts (address: string): Promise<AssetId[]> {
    if (!this.api) return [];
    const accountAssets = await this.api.query.ormlNFT.tokensByOwner.keys(address);
    const assetIds: AssetId[] = [];

    for (const key of accountAssets) {
      const data = key.toHuman() as string[];

      assetIds.push({ classId: data[1], tokenId: parseInt(data[2]).toString() });
    }

    return assetIds;
  }

  public async getCollectionDetails (collectionId: number | string): Promise<any> {
    if (!this.api) return null;

    const metadataCollection = (await this.api.query.ormlNFT.classes(collectionId)).toHuman() as any;

    if (!metadataCollection?.metadata) return null;

    const data = await getMetadata(metadataCollection?.metadata) as unknown as Collection;

    return { ...data, image: parseAcalaIpfsLink(data.image) };
  }

  public async getTokenDetails (assetId: AssetId): Promise<any> {
    if (!this.api) return null;

    return (await this.api.query.ormlNFT.tokens(assetId.classId, assetId.tokenId)).toHuman() as unknown as Token;
  }
}

const headers = {
  'Content-Type': 'application/json'
};

const getMetadata = (metadata_url: string) => {
  let url: string | null = metadata_url;

  if (!metadata_url) return null;
  url = CLOUDFLARE_SERVER + metadata_url + '/metadata.json';

  return fetch(url, {
    method: 'GET',
    headers
  })
    .then((res) => res.json());
};

const parseAcalaIpfsLink = (ipfsLink: string) => {
  if (!ipfsLink || ipfsLink.length === 0) return undefined;

  if (isUrl(ipfsLink)) return ipfsLink;

  if (!ipfsLink.includes('ipfs://')) { return CLOUDFLARE_SERVER + ipfsLink; }

  return CLOUDFLARE_SERVER + ipfsLink.split('ipfs://')[1];
};

const acalaExternalBaseUrl = 'https://apps.acala.network/portfolio/nft/';

// 16J48LCbpH9j1bVngG6E3Nj4NaZFy9SDCSZdg1YjwDaNdMVo
export const handleAcalaNfts = async (address: string) => {
  const allCollections: NftCollection[] = [];
  const api = new AcalaNftApi();

  const assetIds = await api.getNfts(address);

  console.log(assetIds)

  if (!assetIds || assetIds.length === 0) {
    return { total: 0, allCollections };
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
    const tokenInfo = await api.getTokenDetails(assetId);
    let collectionMeta: any;

    if (!(assetId.classId in collectionMetaDict)) {
      collectionMeta = await api.getCollectionDetails(assetId.classId as number);
      collectionMetaDict[assetId.classId] = collectionMeta;
    }

    const parsedNft = {
      id: assetId.tokenId.toString(),
      name: tokenInfo?.name,
      description: tokenInfo && tokenInfo.description ? tokenInfo.description : collectionMeta?.description,
      external_url: acalaExternalBaseUrl + assetId.classId.toString(),
      image: tokenInfo && tokenInfo.image ? parseAcalaIpfsLink(tokenInfo?.image) : collectionMeta?.image,
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

  await api.disconnect();

  return { total: assetIds.length, allCollections };
};
