// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'cross-fetch';

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
    const metadataNft = (await this.dotSamaApi.api.query.uniques.instanceMetadataOf(this.parseTokenId(classId as string), this.parseTokenId(tokenId as string))).toHuman() as MetadataResponse;

    if (!metadataNft?.data) return null;

    // @ts-ignore
    return this.getMetadata(metadataNft?.data);
  }

  private async getCollectionDetail (collectionId: number): Promise<CollectionDetail | null> {
    if (!this.dotSamaApi) return null;
    const collectionMetadata = (await this.dotSamaApi.api.query.uniques.classMetadataOf(collectionId)).toHuman() as MetadataResponse;

    if (!collectionMetadata?.data) return null;

    // @ts-ignore
    return this.getMetadata(collectionMetadata?.data);
  }

  public async handleNfts () {
    // const start = performance.now();

    const assetIds = await this.getNfts(this.addresses);
    const allCollections: NftCollection[] = [];

    try {
      if (!assetIds || assetIds.length === 0) {
        this.total = 0;
        this.data = allCollections;

        return;
      }

      for (const asset of assetIds) {
        const parsedClassId = this.parseTokenId(asset.classId as string);
        const newCollection = {
          collectionId: parsedClassId,
          nftItems: []
        } as NftCollection;

        if (!allCollections.some((collection) => collection.collectionId === parsedClassId)) {
          allCollections.push(newCollection);
        }
      }

      const allItems: NftItem[] = [];
      const collectionMetaDict: Record<string | number, CollectionDetail | null> = {};

      await Promise.all(assetIds.map(async (assetId) => {
        let tokenInfo: Record<any, any> = {};
        const parsedClassId = this.parseTokenId(assetId.classId as string);
        const parsedTokenId = this.parseTokenId(assetId.tokenId as string);

        if (!(parsedClassId in collectionMetaDict)) {
          const [_tokenInfo, _collectionMeta] = await Promise.all([
            this.getTokenDetails(assetId),
            this.getCollectionDetail(parseInt(parsedClassId))
          ]);

          tokenInfo = _tokenInfo as Record<any, any>;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          collectionMetaDict[parsedClassId] = _collectionMeta;
        }

        const parsedNft = {
          id: parsedTokenId,
          name: tokenInfo?.name as string,
          description: tokenInfo?.description as string,
          image: tokenInfo && tokenInfo.image ? this.parseUrl(tokenInfo?.image as string) : undefined,
          collectionId: this.parseTokenId(parsedClassId),
          chain: 'statemine'
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
    } catch (e) {
      console.log('Failed to fetch statemine nft', e);

      return;
    }

    this.total = assetIds.length;
    this.data = allCollections;

    // const end = performance.now();
    //
    // console.log(`statemine took ${end - start}ms`);
    //
    // console.log(`Fetched ${assetIds.length} nfts from statemine`);
  }
}
