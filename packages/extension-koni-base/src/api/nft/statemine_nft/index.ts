// [object Object]
// SPDX-License-Identifier: Apache-2.0

import {ApiProps, NftCollection, NftItem} from '@polkadot/extension-base/background/KoniTypes';
import {BaseNftApi} from "@polkadot/extension-koni-base/api/nft/nft";
import {isUrl} from "@polkadot/extension-koni-base/utils/utils";
import fetch from "node-fetch";

interface AssetId {
  classId: string | number,
  tokenId: string | number
}

export default class StatemineNftApi extends BaseNftApi {

  constructor (api: ApiProps, addresses: string[], chain?: string) {
    super(api, addresses, chain);
  }

  private getMetadata (metadata_url: string) {
    let url: string | undefined = metadata_url;

    if (!isUrl(metadata_url)) {
      url = this.parseUrl(metadata_url);
      if (!url || url.length === 0) return undefined;
    }

    return fetch(url, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'}
    })
      .then((res) => res.json());
  };

  /**
   * Retrieve id of NFTs
   *
   * @returns the array of NFT Ids
   * @param address
   */
  private async getNfts (address: string): Promise<AssetId[]> {
    if (!this.dotSamaApi) return [];
    const accountAssets = await this.dotSamaApi.api.query.uniques.account.keys(address);

    const assetIds: AssetId[] = [];

    for (const key of accountAssets) {
      const data = key.toHuman() as string[];
      assetIds.push({ classId: data[1], tokenId: this.parseTokenId(data[2]) });
    }

    return assetIds;
  }

  private async getTokenDetails (assetId: AssetId): Promise<any> {
    if (!this.dotSamaApi) return null;

    const { classId, tokenId } = assetId;
    const metadataNft = (await this.dotSamaApi.api.query.uniques.instanceMetadataOf(classId, tokenId)).toHuman() as any;

    if (!metadataNft?.data) return null;

    return this.getMetadata(metadataNft?.data);
  }

  private async getCollectionDetail (collectionId: number): Promise<any> {
    if (!this.dotSamaApi) return;
    const metadataCollection = (await this.dotSamaApi.api.query.uniques.classMetadataOf(collectionId)).toHuman() as any;

    return this.getMetadata(metadataCollection?.data);
  }

  public async handleNfts () {
    const assetIds = await this.getNfts(this.addresses[0]);
    const allCollections: NftCollection[] = [];

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

      if (!allCollections.some((collection) => collection.collectionId === asset.classId.toString())) {
        allCollections.push(newCollection);
      }
    });

    const allItems: NftItem[] = [];
    const collectionMetaDict: Record<any, any> = {};

    await Promise.all(assetIds.map(async (assetId) => {
      const tokenInfo = await this.getTokenDetails(assetId);

      if (!(assetId.classId in collectionMetaDict)) {
        collectionMetaDict[assetId.classId] = await this.getCollectionDetail(assetId.classId as number);
      }

      const parsedNft = {
        id: assetId.tokenId.toString(),
        name: tokenInfo?.name,
        description: tokenInfo?.description,
        image: tokenInfo && tokenInfo.image ? this.parseUrl(tokenInfo?.image) : undefined,
        collectionId: assetId.classId.toString()
      } as NftItem;

      allItems.push(parsedNft);
    }));

    for (const collection of allCollections) {
      const collectionMeta = collectionMetaDict[collection.collectionId];

      if (collectionMeta) {
        collection.collectionName = collectionMeta?.name;
        collection.image = collectionMeta.image ? this.parseUrl(collectionMeta?.image) : undefined;
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
