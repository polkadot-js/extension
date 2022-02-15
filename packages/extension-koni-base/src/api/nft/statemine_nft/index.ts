// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import { NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { getMetadata } from '@polkadot/extension-koni-base/api/nft/rmrk_nft';
import { parseIpfsLink } from '@polkadot/extension-koni-base/utils/utils';

import { wsProvider } from '../../connector';
import networks from '../../endpoints';

interface AssetId {
  classId: string | number,
  tokenId: string | number
}

export default class StatemineNftApi {
  api: ApiPromise| null = null;

  constructor () {
  }

  public async connect () {
    this.api = await wsProvider(networks.statemine);
  }

  public async disconnect () {
    if (this.api) { await this.api.disconnect(); }
  }

  /**
   * Retrieve id of NFTs
   *
   * @param owner: address of account
   * @returns the array of NFT Ids
   */
  public async getNfts (address: string): Promise<AssetId[]> {
    if (!this.api) return [];
    const accountAssets = await this.api.query.uniques.account.keys(address);

    const assetIds: AssetId[] = [];

    for (const key of accountAssets) {
      const data = key.toHuman() as string[];

      assetIds.push({ classId: data[1], tokenId: data[2] });
    }

    return assetIds;
  }

  public async getTokenDetails (assetId: AssetId): Promise<any> {
    if (!this.api) return null;

    const { classId, tokenId } = assetId;
    const metadataNft = (await this.api.query.uniques.instanceMetadataOf(classId, tokenId)).toHuman() as any;

    if (!metadataNft?.data) return null;

    return getMetadata(metadataNft?.data);
  }

  public async getCollectionDetail (collectionId: number): Promise<any> {
    if (!this.api) return;
    const metadataCollection = (await this.api.query.uniques.classMetadataOf(collectionId)).toHuman() as any;

    return getMetadata(metadataCollection?.data);
  }
}

export const handleStatemineNfts = async (account: string): Promise<any> => {
  const api = new StatemineNftApi();

  await api.connect();
  // const assetIds = [{classId: 52, tokenId: 0}, {classId: 0, tokenId: 1919}, {classId: 8, tokenId: 1}, {classId: 8, tokenId: 3}, {classId: 8, tokenId: 2}]
  const assetIds = await api.getNfts(account);
  const allCollections: NftCollection[] = [];

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

    if (!(assetId.classId in collectionMetaDict)) {
      collectionMetaDict[assetId.classId] = await api.getCollectionDetail(assetId.classId as number);
    }

    const parsedNft = {
      id: assetId.tokenId.toString(),
      name: tokenInfo?.name,
      description: tokenInfo?.description,
      image: tokenInfo && tokenInfo.image ? parseIpfsLink(tokenInfo?.image) : undefined,
      collectionId: assetId.classId.toString()
    } as NftItem;

    allItems.push(parsedNft);
  }));

  for (const collection of allCollections) {
    const collectionMeta = collectionMetaDict[collection.collectionId];

    if (collectionMeta) {
      collection.collectionName = collectionMeta?.name;
      collection.image = collectionMeta.image ? parseIpfsLink(collectionMeta?.image) : undefined;
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
