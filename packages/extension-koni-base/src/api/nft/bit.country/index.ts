// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'cross-fetch';

import { ApiProps, NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { BIT_COUNTRY_SERVER, SUPPORTED_NFT_NETWORKS } from '@polkadot/extension-koni-base/api/nft/config';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';
import { isUrl } from '@polkadot/extension-koni-base/utils/utils';

interface AssetId {
  classId: string | number,
  tokenId: string | number
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
  // eslint-disable-next-line no-useless-constructor
  constructor (api: ApiProps | null, addresses: string[], chain?: string) {
    super(api, addresses, chain);
  }

  override parseUrl (input: string): string | undefined {
    if (!input || input.length === 0) return undefined;

    if (isUrl(input)) return input;

    if (!input.includes('ipfs://')) { return BIT_COUNTRY_SERVER + input; }

    return BIT_COUNTRY_SERVER + input.split('ipfs://')[1];
  }

  private async getNfts (addresses: string[]): Promise<AssetId[]> {
    if (!this.dotSamaApi) return [];

    let accountAssets: any[] = [];

    await Promise.all(addresses.map(async (address) => {
      // @ts-ignore
      const resp = await this.dotSamaApi.api.query.nft.assetsByOwner(address);
      const parsedResp = resp.toHuman() as any[];

      accountAssets = accountAssets.concat(parsedResp);
    }));

    const assetIds: AssetId[] = [];

    for (const pair of accountAssets) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      assetIds.push({ classId: this.parseTokenId(pair[0] as string), tokenId: this.parseTokenId(pair[1] as string) });
    }

    return assetIds;
  }

  private async getTokenDetails (assetId: AssetId): Promise<Record<string, any> | null> {
    if (!this.dotSamaApi) return null;

    const onChainMeta = (await this.dotSamaApi.api.query.ormlNFT.tokens(assetId.classId, assetId.tokenId)).toHuman() as unknown as Token;

    if (!onChainMeta.metadata) return null;

    return await fetch(BIT_COUNTRY_SERVER + onChainMeta.metadata)
      .then((resp) => resp.json()) as Record<string, any>;
  }

  private async getCollectionDetails (collectionId: string | number): Promise<Record<string, any> | null> {
    if (!this.dotSamaApi) return null;

    const metadataCollection = (await this.dotSamaApi.api.query.ormlNFT.classes(collectionId)).toHuman() as unknown as Collection;

    if (!metadataCollection.metadata) return null;

    return await fetch(BIT_COUNTRY_SERVER + metadataCollection.metadata)
      .then((resp) => resp.json()) as Record<string, any>;
  }

  async fetchNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void): Promise<number> {
    try {
      await this.connect();
      await this.handleNfts(updateItem, updateCollection, updateReady);
    } catch (e) {
      console.log(`error fetching nft from ${this.getChain() as string}`);

      return 0;
    }

    return 1;
  }

  async handleNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void): Promise<void> {
    const assetIds = await this.getNfts(this.addresses);

    try {
      if (!assetIds || assetIds.length === 0) {
        updateReady(true);

        return;
      }

      await Promise.all(assetIds.map(async (assetId) => {
        const parsedClassId = this.parseTokenId(assetId.classId as string);
        const parsedTokenId = this.parseTokenId(assetId.tokenId as string);

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
          chain: SUPPORTED_NFT_NETWORKS.bitcountry
        } as NftItem;

        const parsedCollection = {
          collectionId: parsedClassId,
          chain: SUPPORTED_NFT_NETWORKS.bitcountry,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          collectionName: collectionMeta?.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          image: this.parseUrl(collectionMeta?.image_url as string)
        } as NftCollection;

        updateItem(parsedNft);
        updateCollection(parsedCollection);
        updateReady(true);
      }));
    } catch (e) {
      console.log('Failed to fetch bit.country nft', e);
    }
  }
}
