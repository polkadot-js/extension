// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'cross-fetch';

import { NftCollection, NftItem, RMRK_VER } from '@polkadot/extension-base/background/KoniTypes';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';
import { isUrl, reformatAddress } from '@polkadot/extension-koni-base/utils/utils';

import { KANARIA_ENDPOINT, KANARIA_EXTERNAL_SERVER, RMRK_PINATA_SERVER, SINGULAR_V1_COLLECTION_ENDPOINT, SINGULAR_V1_ENDPOINT, SINGULAR_V1_EXTERNAL_SERVER, SINGULAR_V2_COLLECTION_ENDPOINT, SINGULAR_V2_ENDPOINT, SINGULAR_V2_EXTERNAL_SERVER } from '../config';

const headers = {
  'Content-Type': 'application/json'
};

enum RMRK_SOURCE {
  BIRD_KANARIA = 'bird_kanaria',
  KANARIA = 'kanaria',
  SINGULAR_V1 = 'singular_v1',
  SINGULAR_V2 = 'singular_v2'
}

interface NFTMetadata {
  animation_url?: string,
  attributes?: any[],
  description?: string,
  image?: string,
  name?: string
  properties?: Record<string, any>
  mediaUri?: string,
}

interface NFTResource {
  id?: string,
  slot_id?: any[],
  src?: string,
  thumb?: string,
  metadata?: string
}

export class RmrkNftApi extends BaseNftApi {
  // eslint-disable-next-line no-useless-constructor
  constructor () {
    super();
  }

  override setAddresses (addresses: string[]) {
    super.setAddresses(addresses);
    const kusamaAddresses = [];

    for (const address of this.addresses) {
      const kusamaAddress = reformatAddress(address, 2);

      kusamaAddresses.push(kusamaAddress);
    }

    this.addresses = kusamaAddresses;
  }

  override parseUrl (input: string): string | undefined {
    if (!input || input.length === 0) return undefined;

    if (isUrl(input) || input.includes('https://') || input.includes('http')) return input;

    if (!input.includes('ipfs://ipfs/')) { return RMRK_PINATA_SERVER + input; }

    return RMRK_PINATA_SERVER + input.split('ipfs://ipfs/')[1];
  }

  private async getMetadata (metadataUrl: string): Promise<NFTMetadata | undefined> {
    let url: string | undefined = metadataUrl;

    if (!isUrl(metadataUrl)) {
      url = this.parseUrl(metadataUrl);
      if (!url || url.length === 0) return undefined;
    }

    return await fetch(url, {
      method: 'GET',
      headers
    })
      .then((res) => res.json()) as NFTMetadata;
  }

  private async getAllByAccount (account: string) {
    const fetchUrls = [
      { url: KANARIA_ENDPOINT + 'account-birds/' + account, source: RMRK_SOURCE.BIRD_KANARIA },
      { url: KANARIA_ENDPOINT + 'account-items/' + account, source: RMRK_SOURCE.KANARIA },
      { url: SINGULAR_V1_ENDPOINT + account, source: RMRK_SOURCE.SINGULAR_V1 },
      { url: SINGULAR_V2_ENDPOINT + account, source: RMRK_SOURCE.SINGULAR_V2 }
    ];

    let data: Record<number | string, number | string | NFTResource>[] = [];

    await Promise.all(fetchUrls.map(async ({ source, url }) => {
      let _data = await fetch(url, {
        method: 'GET',
        headers
      })
        .then((res) => res.json()) as Record<number | string, number | string | NFTResource>[];

      _data = _data.map((item) => { return { ...item, source }; });

      data = data.concat(_data);
    }));

    const nfts: Record<string | number, any>[] = [];

    await Promise.all(data.map(async (item: Record<number | string, number | string | NFTResource>) => {
      const primaryResource = item.primaryResource ? item.primaryResource as NFTResource : null;
      const metadataUri = primaryResource && primaryResource.metadata ? primaryResource.metadata : item.metadata;
      const result = await this.getMetadata(metadataUri as string);

      if (item.source === RMRK_SOURCE.BIRD_KANARIA) {
        nfts.push({
          ...item,
          metadata: result,
          external_url: KANARIA_EXTERNAL_SERVER + item.id.toString()
        });
      } else if (item.source === RMRK_SOURCE.KANARIA) {
        nfts.push({
          ...item,
          metadata: {
            ...result,
            image: this.parseUrl(result?.image as string)
          },
          external_url: KANARIA_EXTERNAL_SERVER + item.id.toString()
        });
      } else if (item.source === RMRK_SOURCE.SINGULAR_V1) {
        nfts.push({
          ...item,
          metadata: {
            description: result?.description,
            name: result?.name,
            attributes: result?.attributes,
            animation_url: this.parseUrl(result?.animation_url as string),
            image: this.parseUrl(result?.image as string)
          },
          external_url: SINGULAR_V1_EXTERNAL_SERVER + item.id.toString()
        });
      } else if (item.source === RMRK_SOURCE.SINGULAR_V2) {
        const id = item.id as string;

        if (!id.toLowerCase().includes('kanbird')) { // excludes kanaria bird, already handled above
          nfts.push({
            ...item,
            metadata: {
              description: result?.description,
              name: result?.name,
              attributes: result?.attributes,
              properties: result?.properties,
              animation_url: this.parseUrl(result?.animation_url as string),
              image: this.parseUrl(result?.mediaUri as string)
            },
            external_url: SINGULAR_V2_EXTERNAL_SERVER + item.id.toString()
          });
        }
      }
    }));

    return nfts;
  }

  public async handleNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void) {
    // const start = performance.now();

    let allNfts: Record<string | number, any>[] = [];
    const allCollections: NftCollection[] = [];

    try {
      await Promise.all(this.addresses.map(async (address) => {
        const nfts = await this.getAllByAccount(address);

        allNfts = allNfts.concat(nfts);
      }));

      if (allNfts.length <= 0) {
        updateReady(true);
      }

      const collectionInfoUrl: string[] = [];

      for (const item of allNfts) {
        const parsedItem = {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          id: item?.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          name: item?.metadata?.name as string,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
          image: this.parseUrl(item.image ? item.image : item.metadata.image ? item.metadata.image : item.metadata.animation_url as string),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          description: item?.metadata?.description as string,
          external_url: item?.external_url as string,
          rarity: item?.metadata_rarity as string,
          collectionId: item?.collectionId as string,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          properties: item?.metadata?.properties as Record<any, any>,
          chain: 'kusama',
          rmrk_ver: item.source && item.source === RMRK_SOURCE.SINGULAR_V1 ? RMRK_VER.VER_1 : RMRK_VER.VER_2
        } as NftItem;

        updateItem(parsedItem);

        let url = '';

        if (item.source === RMRK_SOURCE.SINGULAR_V1) {
          url = SINGULAR_V1_COLLECTION_ENDPOINT + (item.collectionId as string);
        } else {
          url = SINGULAR_V2_COLLECTION_ENDPOINT + (item.collectionId as string);
        }

        if (!collectionInfoUrl.includes(url)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          allCollections.push({ collectionId: item.collectionId });
          collectionInfoUrl.push(url.replace(' ', '%20'));
        }
      }

      const allCollectionMetaUrl: Record<string, any>[] = [];

      await Promise.all(collectionInfoUrl.map(async (url) => {
        const data = await fetch(url)
          .then((resp) => resp.json()) as Record<string | number, string | number>[];
        const result = data[0];

        if (result && 'metadata' in result) {
          allCollectionMetaUrl.push({
            url: this.parseUrl(result?.metadata as string),
            id: result?.id
          });
        }

        if (data.length > 0) return result;
        else return {};
      }));

      const allCollectionMeta: Record<string | number, any> = {};

      await Promise.all(allCollectionMetaUrl.map(async (item) => {
        let data: Record<string, any> = {};

        if (item.url) {
          data = await fetch(item?.url as string)
            .then((resp) => resp.json()) as Record<string, any>;
        }

        if ('mediaUri' in data) { // rmrk v2.0
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          allCollectionMeta[item?.id as string] = { ...data, image: data.mediaUri };
        } else {
          allCollectionMeta[item?.id as string] = { ...data };
        }
      }));

      allCollections.forEach((item) => {
        const parsedCollection = {
          collectionId: item.collectionId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          collectionName: allCollectionMeta[item.collectionId] ? allCollectionMeta[item.collectionId].name as string : null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          image: allCollectionMeta[item.collectionId] ? this.parseUrl(allCollectionMeta[item.collectionId].image as string) : null,
          chain: 'kusama'
        } as NftCollection;

        updateCollection(parsedCollection);
        updateReady(true);
      });
    } catch (e) {
      console.error('Failed to fetch rmrk nft', e);
    }
  }

  public async fetchNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void): Promise<number> {
    try {
      await this.handleNfts(updateItem, updateCollection, updateReady);
    } catch (e) {
      return 0;
    }

    return 1;
  }
}
