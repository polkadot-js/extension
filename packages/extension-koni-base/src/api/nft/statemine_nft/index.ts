// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import fetch from 'node-fetch';

import { ApiProps, NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';
import { isUrl } from '@polkadot/extension-koni-base/utils/utils';

interface AssetId {
  classId: string | number,
  tokenId: string | number
}

interface MetadataResponse {
  deposit?: string,
  data?: string,
  isFrozen?: boolean
}

interface TokenDetail {
  description?: string,
  name?: string,
  attributes?: any[],
  image?: string
}

interface CollectionDetail {
  name?: string,
  image?: string,
  external_url?: string,
  description?: string
}

export default class StatemineNftApi extends BaseNftApi {
  // eslint-disable-next-line no-useless-constructor
  constructor (api: ApiProps, addresses: string[], chain?: string) {
    super(api, addresses, chain);
  }

  private getMetadata (metadataUrl: string) {
    let url: string | undefined = metadataUrl;

    if (!isUrl(metadataUrl)) {
      url = this.parseUrl(metadataUrl);
      if (!url || url.length === 0) return undefined;
    }

    return fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((res) => res.json());
  }

  /**
   * Retrieve id of NFTs
   *
   * @returns the array of NFT Ids
   * @param addresses
   */
  private async getNfts (addresses: string[]): Promise<AssetId[]> {
    if (!this.dotSamaApi) return [];

    let accountAssets: any[] = [];

    await Promise.all(addresses.map(async (address) => {
      // @ts-ignore
      const resp = await this.dotSamaApi.api.query.uniques.account.keys(address);

      accountAssets = accountAssets.concat(...resp);
    }));

    const assetIds: AssetId[] = [];

    for (const key of accountAssets) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const data = key.toHuman() as string[];

      assetIds.push({ classId: data[1], tokenId: this.parseTokenId(data[2]) });
    }

    return assetIds;
  }

  private async getTokenDetails (assetId: AssetId): Promise<TokenDetail | null> {
    if (!this.dotSamaApi) return null;

    const { classId, tokenId } = assetId;
    const metadataNft = (await this.dotSamaApi.api.query.uniques.instanceMetadataOf(classId, tokenId)).toHuman() as MetadataResponse;

    if (!metadataNft?.data) return null;

    return this.getMetadata(metadataNft?.data);
  }

  private async getCollectionDetail (collectionId: number): Promise<CollectionDetail | null> {
    if (!this.dotSamaApi) return null;
    const collectionMetadata = (await this.dotSamaApi.api.query.uniques.classMetadataOf(collectionId)).toHuman() as MetadataResponse;

    if (!collectionMetadata?.data) return null;

    return this.getMetadata(collectionMetadata?.data);
  }

  public async handleNfts () {
    const assetIds = await this.getNfts(this.addresses);
    const allCollections: NftCollection[] = [];

    if (!assetIds || assetIds.length === 0) {
      this.total = 0;
      this.data = allCollections;

      return;
    }

    for (const asset of assetIds) {
      const newCollection = {
        collectionId: asset.classId.toString(),
        nftItems: []
      } as NftCollection;

      if (!allCollections.some((collection) => collection.collectionId === asset.classId.toString())) {
        allCollections.push(newCollection);
      }
    }

    const allItems: NftItem[] = [];
    const collectionMetaDict: Record<string | number, CollectionDetail | null> = {};

    await Promise.all(assetIds.map(async (assetId) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const tokenInfo = await this.getTokenDetails(assetId);

      if (!(assetId.classId in collectionMetaDict)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
          // @ts-ignore
          collection.nftItems.push(item);
        }
      }
    }

    this.total = assetIds.length;
    this.data = allCollections;
  }
}
