// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { BIT_COUNTRY_SERVER } from '@subwallet/extension-koni-base/api/nft/config';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-koni-base/api/nft/nft';
import { isUrl } from '@subwallet/extension-base/utils';
import fetch from 'cross-fetch';

interface AssetId {
  classId: string | number,
  tokenId: string | number,
  owner: string
}

interface Token {
  metadata: string,
  owner?: string,
  data?: Record<string, any>
}

interface Collection {
  metadata: string,
  totalIssuance: string,
  owner: string,
  data: Record<string, any>
}

export class BitCountryNftApi extends BaseNftApi {
  constructor (api: _SubstrateApi | null, addresses: string[], chain: string) {
    super(chain, api, addresses);
  }

  override parseUrl (input: string): string | undefined {
    if (!input || input.length === 0) {
      return undefined;
    }

    if (isUrl(input)) {
      return input;
    }

    if (!input.includes('ipfs://')) {
      return BIT_COUNTRY_SERVER + input;
    }

    return BIT_COUNTRY_SERVER + input.split('ipfs://')[1];
  }

  private async getNfts (addresses: string[]): Promise<AssetId[]> {
    if (!this.substrateApi) {
      return [];
    }

    const assetIds: AssetId[] = [];

    await Promise.all(addresses.map(async (address) => {
      // @ts-ignore
      const resp = await this.substrateApi.api.query.ormlNFT.tokensByOwner.entries(address);

      for (const item of resp) {
        const data = item[0].toHuman() as string[];

        assetIds.push({ classId: this.parseTokenId(data[1]), tokenId: this.parseTokenId(data[2]), owner: address });
      }
    }));

    return assetIds;
  }

  private async getTokenDetails (assetId: AssetId): Promise<Record<string, any> | null> {
    if (!this.substrateApi) {
      return null;
    }

    const onChainMeta = (await this.substrateApi.api.query.ormlNFT.tokens(assetId.classId, assetId.tokenId)).toHuman() as unknown as Token;

    if (!onChainMeta.metadata) {
      return null;
    }

    return await fetch(BIT_COUNTRY_SERVER + onChainMeta.metadata)
      .then((resp) => resp.json()) as Record<string, any>;
  }

  private async getCollectionDetails (collectionId: string | number): Promise<Record<string, any> | null> {
    if (!this.substrateApi) {
      return null;
    }

    const metadataCollection = (await this.substrateApi.api.query.ormlNFT.classes(collectionId)).toHuman() as unknown as Collection;

    if (!metadataCollection.metadata) {
      return null;
    }

    return await fetch(BIT_COUNTRY_SERVER + metadataCollection.metadata)
      .then((resp) => resp.json()) as Record<string, any>;
  }

  async fetchNfts (params: HandleNftParams): Promise<number> {
    try {
      await this.connect();
      await this.handleNfts(params);
    } catch (e) {
      return 0;
    }

    return 1;
  }

  async handleNft (address: string, params: HandleNftParams): Promise<void> {
    const assetIds = await this.getNfts([address]);

    try {
      if (!assetIds || assetIds.length === 0) {
        // params.updateReady(true);
        params.updateNftIds(this.chain, address);

        return;
      }

      const collectionNftIds: Record<string, string[]> = {};

      await Promise.all(assetIds.map(async (assetId) => {
        const parsedClassId = this.parseTokenId(assetId.classId as string);
        const parsedTokenId = this.parseTokenId(assetId.tokenId as string);

        if (collectionNftIds[parsedClassId]) {
          collectionNftIds[parsedClassId].push(parsedTokenId);
        } else {
          collectionNftIds[parsedClassId] = [parsedTokenId];
        }

        const [tokenInfo, collectionMeta] = await Promise.all([
          this.getTokenDetails(assetId),
          this.getCollectionDetails(parsedClassId)
        ]);

        const parsedNft = {
          id: parsedTokenId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          name: tokenInfo?.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          description: tokenInfo && tokenInfo.description ? tokenInfo.description : collectionMeta?.description,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          image: tokenInfo && tokenInfo.image_url ? this.parseUrl(tokenInfo?.image_url as string) : this.parseUrl(collectionMeta?.image_url as string),
          collectionId: parsedClassId,
          chain: this.chain,
          owner: address
        } as NftItem;

        const parsedCollection = {
          collectionId: parsedClassId,
          chain: this.chain,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          collectionName: collectionMeta?.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          image: this.parseUrl(collectionMeta?.image_url as string)
        } as NftCollection;

        params.updateItem(this.chain, parsedNft, address);
        params.updateCollection(this.chain, parsedCollection);
        // params.updateReady(true);
      }));

      params.updateCollectionIds(this.chain, address, Object.keys(collectionNftIds));
      Object.entries(collectionNftIds).forEach(([collectionId, nftIds]) => params.updateNftIds(this.chain, address, collectionId, nftIds));
    } catch (e) {
      console.error('Failed to fetch bit.country nft', e);
    }
  }

  public async handleNfts (params: HandleNftParams) {
    await Promise.all(this.addresses.map((address) => this.handleNft(address, params)));
  }
}
