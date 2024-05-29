// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { getRandomIpfsGateway } from '@subwallet/extension-base/koni/api/nft/config';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-base/koni/api/nft/nft';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { isUrl } from '@subwallet/extension-base/utils';

interface AssetId {
  classId: string | number,
  tokenId: string | number,
  owner: string
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

export class KaruraNftApi extends BaseNftApi {
  // eslint-disable-next-line no-useless-constructor
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
      return getRandomIpfsGateway() + input;
    }

    return getRandomIpfsGateway() + input.split('ipfs://')[1];
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

    const accountAssets: Record<string, any[]> = {};

    await Promise.all(addresses.map(async (address) => {
      // @ts-ignore
      const resp = await this.substrateApi.api.query.ormlNFT.tokensByOwner.keys(address);

      if (address in accountAssets) {
        accountAssets[address].concat(resp);
      } else {
        accountAssets[address] = resp;
      }
    }));

    const assetIds: AssetId[] = [];

    Object.entries(accountAssets).forEach(([owner, rawData]) => {
      for (const key of rawData) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const data = key.toHuman() as string[];

        assetIds.push({ classId: data[1], tokenId: this.parseTokenId(data[2]), owner });
      }
    });

    return assetIds;
  }

  private async getCollectionDetails (collectionId: number | string): Promise<Record<string, any> | null> {
    if (!this.substrateApi) {
      return null;
    }

    const metadataCollection = (await this.substrateApi.api.query.ormlNFT.classes(collectionId)).toHuman() as Record<string, any>;

    if (!metadataCollection?.metadata) {
      return null;
    }

    const data = await getKaruraMetadata(metadataCollection?.metadata as string) as unknown as Collection;

    return { ...data, image: this.parseUrl(data.image) };
  }

  private async getTokenDetails (assetId: AssetId): Promise<Token | null> {
    if (!this.substrateApi) {
      return null;
    }

    return (await this.substrateApi.api.query.ormlNFT.tokens(assetId.classId, assetId.tokenId)).toHuman() as unknown as Token;
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
          this.getCollectionDetails(parseInt(parsedClassId))
        ]);

        const parsedNft = {
          id: parsedTokenId,
          name: tokenInfo?.name,
          description: tokenInfo?.description,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          image: tokenInfo && tokenInfo.image ? this.parseUrl(tokenInfo?.image) : collectionMeta?.image,
          collectionId: parsedClassId,
          chain: this.chain,
          owner: assetId.owner
        } as NftItem;

        const parsedCollection = {
          collectionId: parsedClassId,
          chain: this.chain,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          collectionName: collectionMeta?.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          image: collectionMeta?.image
        } as NftCollection;

        params.updateItem(this.chain, parsedNft, address);
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

const getKaruraMetadata = (metadataUrl: string) => {
  let url: string | null = metadataUrl;

  if (!metadataUrl) {
    return null;
  }

  url = getRandomIpfsGateway() + metadataUrl + '/metadata.json';

  return fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
    .then((res) => res.json());
};
