// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AssetHubNftType, NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-base/koni/api/nft/nft';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { isUrl } from '@subwallet/extension-base/utils';
import fetch from 'cross-fetch';

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

export default class AssetHubUniquesPalletApi extends BaseNftApi {
  // eslint-disable-next-line no-useless-constructor
  constructor (api: _SubstrateApi | null, addresses: string[], chain: string) {
    super(chain, api, addresses);
  }

  private getMetadata (metadataUrl: string) {
    let url: string | undefined = metadataUrl;

    if (!isUrl(metadataUrl)) {
      url = this.parseUrl(metadataUrl);

      if (!url || url.length === 0) {
        return undefined;
      }
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
    if (!this.substrateApi) {
      return [];
    }

    const assetIds: AssetId[] = [];

    await Promise.all(addresses.map(async (address) => {
      // @ts-ignore
      const resp = await this.substrateApi.api.query.uniques.account.keys(address);

      if (resp) {
        for (const key of resp) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          const data = key.toHuman() as string[];

          assetIds.push({ classId: data[1], tokenId: this.parseTokenId(data[2]) });
        }
      }
    }));

    return assetIds;
  }

  private async getTokenDetails (assetId: AssetId): Promise<TokenDetail | null> {
    if (!this.substrateApi) {
      return null;
    }

    const { classId, tokenId } = assetId;
    const metadataNft = (await this.substrateApi.api.query.uniques.instanceMetadataOf(this.parseTokenId(classId as string), this.parseTokenId(tokenId as string))).toHuman() as MetadataResponse;

    if (!metadataNft?.data) {
      return null;
    }

    // @ts-ignore
    return this.getMetadata(metadataNft?.data);
  }

  private async getCollectionDetail (collectionId: number): Promise<CollectionDetail | null> {
    if (!this.substrateApi) {
      return null;
    }

    const collectionMetadata = (await this.substrateApi.api.query.uniques.classMetadataOf(collectionId)).toHuman() as MetadataResponse;

    if (!collectionMetadata?.data) {
      return null;
    }

    // @ts-ignore
    return this.getMetadata(collectionMetadata?.data);
  }

  public async handleNft (address: string, params: HandleNftParams) {
    // const start = performance.now();

    const assetIds = await this.getNfts([address]);

    try {
      if (!assetIds || assetIds.length === 0) {
        return;
      }

      const collectionIds: string[] = [];
      const nftIds: string[] = [];

      await Promise.all(assetIds.map(async (assetId) => {
        const parsedClassId = this.parseTokenId(assetId.classId as string);
        const parsedTokenId = this.parseTokenId(assetId.tokenId as string);

        if (!collectionIds.includes(parsedClassId)) {
          collectionIds.push(parsedClassId);
        }

        nftIds.push(parsedTokenId);

        const [tokenInfo, collectionMeta] = await Promise.all([
          this.getTokenDetails(assetId),
          this.getCollectionDetail(parseInt(parsedClassId))
        ]);

        const parsedNft = {
          id: parsedTokenId,
          name: tokenInfo?.name as string,
          description: tokenInfo?.description as string,
          image: tokenInfo && tokenInfo.image ? this.parseUrl(tokenInfo?.image) : undefined,
          collectionId: this.parseTokenId(parsedClassId),
          chain: this.chain,
          owner: address,
          assetHubType: AssetHubNftType.UNIQUES
        } as NftItem;

        params.updateItem(this.chain, parsedNft, address);

        const parsedCollection = {
          collectionId: parsedClassId,
          chain: this.chain,
          collectionName: collectionMeta?.name,
          image: collectionMeta && collectionMeta.image ? this.parseUrl(collectionMeta?.image) : undefined
        } as NftCollection;

        params.updateCollection(this.chain, parsedCollection);
      }));
    } catch (e) {
      console.error(`${this.chain}`, e);
    }
  }

  public async handleNfts (params: HandleNftParams) {
    await Promise.all(this.addresses.map((address) => this.handleNft(address, params)));
  }

  public async fetchNfts (params: HandleNftParams): Promise<number> {
    try {
      await this.connect();
      await this.handleNfts(params);
    } catch (e) {
      return 0;
    }

    return 1;
  }
}
