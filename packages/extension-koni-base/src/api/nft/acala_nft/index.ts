// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'cross-fetch';

import { ApiProps, NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import {CLOUDFLARE_SERVER, SUPPORTED_NFT_NETWORKS} from '@polkadot/extension-koni-base/api/nft/config';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';
import { isUrl } from '@polkadot/extension-koni-base/utils/utils';

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
  metadata?: string | undefined,
  owner?: string,
  data?: Record<string, any>
  name?: string,
  description?: string,
  image?: string
}

const acalaExternalBaseUrl = 'https://apps.acala.network/portfolio/nft/';

export class AcalaNftApi extends BaseNftApi {
  // eslint-disable-next-line no-useless-constructor
  constructor (api: ApiProps | null, addresses: string[], chain?: string) {
    super(api, addresses, chain);
  }

  override parseUrl (input: string): string | undefined {
    if (!input || input.length === 0) return undefined;

    if (isUrl(input)) return input;

    if (!input.includes('ipfs://')) { return CLOUDFLARE_SERVER + input; }

    return CLOUDFLARE_SERVER + input.split('ipfs://')[1];
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
      const resp = await this.dotSamaApi.api.query.ormlNFT.tokensByOwner.keys(address);

      accountAssets = accountAssets.concat(resp);
    }));

    const assetIds: AssetId[] = [];

    for (const key of accountAssets) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const data = key.toHuman() as string[];

      assetIds.push({ classId: data[1], tokenId: this.parseTokenId(data[2]) });
    }

    return assetIds;
  }

  private async getCollectionDetails (collectionId: number | string): Promise<Record<string, any> | null> {
    if (!this.dotSamaApi) return null;

    const metadataCollection = (await this.dotSamaApi.api.query.ormlNFT.classes(collectionId)).toHuman() as Record<string, any>;

    if (!metadataCollection?.metadata) return null;

    const data = await getMetadata(metadataCollection?.metadata as string) as unknown as Collection;

    return { ...data, image: this.parseUrl(data.image) };
  }

  private async getTokenDetails (assetId: AssetId): Promise<Token | null> {
    if (!this.dotSamaApi) return null;

    return (await this.dotSamaApi.api.query.ormlNFT.tokens(assetId.classId, assetId.tokenId)).toHuman() as unknown as Token;
  }

  public async handleNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void) {
    // const start = performance.now();
    const assetIds = await this.getNfts(this.addresses);

    try {
      if (!assetIds || assetIds.length === 0) return;

      await Promise.all(assetIds.map(async (assetId) => {
        const parsedClassId = this.parseTokenId(assetId.classId as string);
        const parsedTokenId = this.parseTokenId(assetId.tokenId as string);

        const [tokenInfo, collectionMeta] = await Promise.all([
          this.getTokenDetails(assetId),
          this.getCollectionDetails(parseInt(parsedClassId))
        ]);

        const parsedNft = {
          id: parsedTokenId,
          name: tokenInfo?.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          description: tokenInfo && tokenInfo.description ? tokenInfo.description : collectionMeta?.description,
          external_url: acalaExternalBaseUrl + parsedClassId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          image: tokenInfo && tokenInfo.image ? this.parseUrl(tokenInfo?.image) : collectionMeta?.image,
          collectionId: parsedClassId,
          chain: SUPPORTED_NFT_NETWORKS.acala
        } as NftItem;

        const parsedCollection = {
          collectionId: parsedClassId,
          chain: SUPPORTED_NFT_NETWORKS.acala,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          collectionName: collectionMeta?.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          image: collectionMeta?.image
        } as NftCollection;

        updateItem(parsedNft);
        updateCollection(parsedCollection);
      }));
    } catch (e) {
      console.log('Failed to fetch acala nft', e);
    }

    // const end = performance.now();

    // console.log(`acala took ${end - start}ms`);
    //
    // console.log(`Fetched ${assetIds.length} nfts from acala`);
  }

  public async fetchNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void): Promise<number> {
    try {
      await this.connect();
      await this.handleNfts(updateItem, updateCollection);
    } catch (e) {
      console.log(`error fetching nft from ${this.getChain() as string}`);

      return 0;
    }

    return 1;
  }
}

const headers = {
  'Content-Type': 'application/json'
};

const getMetadata = (metadataUrl: string) => {
  let url: string | null = metadataUrl;

  if (!metadataUrl) return null;
  url = CLOUDFLARE_SERVER + metadataUrl + '/metadata.json';

  return fetch(url, {
    method: 'GET',
    headers
  })
    .then((res) => res.json());
};
