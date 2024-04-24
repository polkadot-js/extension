// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { BIT_AVATAR_API, BIT_COUNTRY_IPFS_SERVER, BIT_COUNTRY_LAND_ESTATE_METADATA_API } from '@subwallet/extension-base/koni/api/nft/config';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-base/koni/api/nft/nft';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { isUrl } from '@subwallet/extension-base/utils';

import { BN_ZERO, hexToBn } from '@polkadot/util';

interface AssetId {
  classId: string | number,
  tokenId: string | number,
  owner: string
}

interface OrmlNftTokenInfo {
  metadata: unknown,
  owner: string,
  data: {
    deposit: string,
    attributes: Record<string, unknown>,
    isLocked: boolean
  }
}

interface OrmlNftClassInfo {
  metadata: unknown,
  totalIssuance: number,
  owner: string,
  data: {
    deposit: string,
    attributes: Record<string, unknown>,
    tokenType: string,
    collectionType: string,
    isLocked: boolean,
    totalMintedTokens: number,
    mintLimit: unknown,
    royaltyFee: string
  }
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
      return BIT_COUNTRY_IPFS_SERVER + input;
    }

    return BIT_COUNTRY_IPFS_SERVER + input.split('ipfs://')[1];
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

    const onChainMeta = (await this.substrateApi.api.query.ormlNFT.tokens(assetId.classId, assetId.tokenId)).toHuman() as unknown as OrmlNftTokenInfo;

    if (!onChainMeta.metadata) {
      return null;
    }

    // check if NFT is Land/Estate
    if (onChainMeta.data.attributes['MetaverseId:']) {
      return await fetch(`${BIT_COUNTRY_LAND_ESTATE_METADATA_API}/${assetId.classId}/${assetId.tokenId}/metadata.json`)
        .then((resp) => resp.json()) as Record<string, any>;
    } else if ((onChainMeta.metadata as string).startsWith('/avatar/')) {
      return await fetch(BIT_AVATAR_API + (onChainMeta.metadata as string))
        .then((resp) => resp.json()) as Record<string, any>;
    } else {
      return await fetch(BIT_COUNTRY_IPFS_SERVER + (onChainMeta.metadata as string))
        .then((resp) => resp.json()) as Record<string, any>;
    }
  }

  private async getCollectionDetails (collectionId: string | number): Promise<Record<string, any> | null> {
    if (!this.substrateApi) {
      return null;
    }

    const metadataCollection = (await this.substrateApi.api.query.ormlNFT.classes(collectionId)).toHuman() as unknown as OrmlNftClassInfo;

    if (!metadataCollection.metadata) {
      return null;
    }

    if (metadataCollection.data.attributes['MetaverseId:']) {
      const category = metadataCollection.data.attributes['Category:'] as string;
      const hexMetaverseId = metadataCollection.data.attributes['MetaverseId:'] as string;
      let metaverseId = BN_ZERO;

      try {
        metaverseId = hexToBn(hexMetaverseId);
      } catch (e) {
        console.warn('Error parsing metaverse id', e);
      }

      return {
        name: `${category} #${collectionId}`,
        metaverseId: metaverseId.toString()
      };
    } else {
      return await fetch(BIT_COUNTRY_IPFS_SERVER + (metadataCollection.metadata as string))
        .then((resp) => resp.json()) as Record<string, any>;
    }
  }

  private parseMetadata (data: Record<string, unknown> | null): NftItem {
    const traitList = data?.traits ? data.traits as Record<string, unknown>[] : data?.attributes as Record<string, unknown>[];
    const propertiesMap: Record<string, unknown> = {};

    if (traitList) {
      traitList.forEach((traitMap) => {
        propertiesMap[traitMap.trait_type as string] = {
          value: traitMap.value as string
        };
      });
    }

    return {
      name: data?.name,
      image: data?.image_url ? this.parseUrl(data.image_url as string) : this.parseUrl(data?.image as string),
      description: data?.description as string | undefined,
      properties: propertiesMap,
      externalUrl: data?.external_url as string | undefined,
      chain: this.chain
    } as NftItem;
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
          this.getCollectionDetails(parsedClassId)
        ]);

        const parsedNft = this.parseMetadata(tokenInfo);

        parsedNft.collectionId = parsedClassId;
        parsedNft.id = parsedTokenId;
        parsedNft.owner = address;

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
      }));
    } catch (e) {
      console.error(`${this.chain}`, e);
    }
  }

  public async handleNfts (params: HandleNftParams) {
    await Promise.all(this.addresses.map((address) => this.handleNft(address, params)));
  }
}
