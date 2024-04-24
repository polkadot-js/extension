// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem, RMRK_VER } from '@subwallet/extension-base/background/KoniTypes';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-base/koni/api/nft/nft';
import { isUrl, reformatAddress } from '@subwallet/extension-base/utils';

import { SINGULAR_V1_COLLECTION_ENDPOINT, SINGULAR_V2_COLLECTION_ENDPOINT, SINGULAR_V2_ENDPOINT } from '../config';

enum RMRK_SOURCE {
  BIRD_KANARIA = 'bird_kanaria',
  KANARIA = 'kanaria',
  SINGULAR_V1 = 'singular_v1',
  SINGULAR_V2 = 'singular_v2'
}

const KANBIRD_KEYWORD = 'KANBIRD';

interface NFTMetadata {
  animation_url?: string,
  attributes?: any[],
  description?: string,
  image?: string,
  name?: string
  properties?: Record<string, any>
  mediaUri?: string,
}

interface RmrkNftResponse {
  id: string,
  collection?: {
    name: string
  }
  collectionId: string,
  metadata: string,
  primaryResource?: {
    id: string,
    src: string,
    thumb: string,
    metadata: string | null
  },
  source?: RMRK_SOURCE
}

export class RmrkNftApi extends BaseNftApi {
  constructor (addresses: string[], chain: string) {
    super(chain, null, addresses);
  }

  // override parseUrl (input: string): string | undefined {
  //   if (!input || input.length === 0) {
  //     return undefined;
  //   }
  //
  //   if (isUrl(input) || input.includes('https://') || input.includes('http')) {
  //     return input;
  //   }
  //
  //   if (!input.includes('ipfs://ipfs/')) {
  //     return getRandomIpfsGateway() + input;
  //   }
  //
  //   return getRandomIpfsGateway() + input.split('ipfs://ipfs/')[1];
  // }

  private async getMetadata (metadataUrl: string): Promise<NFTMetadata | undefined> {
    let url: string | undefined = metadataUrl;

    if (!isUrl(metadataUrl)) {
      url = this.parseUrl(metadataUrl);

      if (!url || url.length === 0) {
        return undefined;
      }
    }

    return await fetch(url, {
      method: 'GET'
    })
      .then((res) => res.json()) as NFTMetadata;
  }

  private async getAllByAccount (account: string) {
    const fetchUrls = [
      { url: SINGULAR_V2_ENDPOINT + account, source: RMRK_SOURCE.SINGULAR_V2 }
    ];

    let data: RmrkNftResponse[] = [];

    await Promise.all(fetchUrls.map(async ({ source, url }) => {
      let _data = await fetch(url, {
        method: 'GET'
      })
        .then((res) => res.json()) as RmrkNftResponse[];

      _data = _data.map((item) => {
        let nftSource = source;

        if (item.collectionId.includes(KANBIRD_KEYWORD)) {
          nftSource = RMRK_SOURCE.BIRD_KANARIA;
        }

        return { ...item, source: nftSource };
      });

      data = data.concat(_data);
    }));

    const nfts: Record<string | number, any>[] = [];

    await Promise.all(data.map(async (item) => {
      try {
        const primaryResource = item.primaryResource ? item.primaryResource : null;
        const metadataUri = primaryResource && primaryResource.metadata ? primaryResource.metadata : item.metadata;
        const nftMetadata = await this.getMetadata(metadataUri);

        if (item.source === RMRK_SOURCE.BIRD_KANARIA) {
          nfts.push({
            ...item,
            metadata: nftMetadata,
            owner: account
          });
        } else if (item.source === RMRK_SOURCE.KANARIA) {
          nfts.push({
            ...item,
            metadata: {
              ...nftMetadata,
              image: this.parseUrl(nftMetadata?.image as string)
            },
            owner: account
          });
        } else if (item.source === RMRK_SOURCE.SINGULAR_V1) {
          nfts.push({
            ...item,
            metadata: {
              description: nftMetadata?.description,
              name: nftMetadata?.name,
              attributes: nftMetadata?.attributes,
              animation_url: this.parseUrl(nftMetadata?.animation_url as string),
              image: this.parseUrl(nftMetadata?.image as string)
            },
            owner: account
          });
        } else if (item.source === RMRK_SOURCE.SINGULAR_V2) {
          const id = item.id;

          if (!id.toLowerCase().includes(KANBIRD_KEYWORD)) { // excludes kanaria bird, already handled above
            nfts.push({
              ...item,
              metadata: {
                description: nftMetadata?.description,
                name: nftMetadata?.name,
                attributes: nftMetadata?.attributes,
                properties: nftMetadata?.properties,
                animation_url: this.parseUrl(nftMetadata?.animation_url as string),
                image: this.parseUrl(nftMetadata?.mediaUri as string)
              },
              owner: account
            });
          }
        }
      } catch (e) {
        console.log('error fetching RMRK NFT', e);
      }
    }));

    return nfts;
  }

  public async handleNft (address: string, params: HandleNftParams) {
    // const start = performance.now();

    let allNfts: Record<string | number, any>[] = [];
    const allCollections: NftCollection[] = [];

    try {
      const kusamaAddress = reformatAddress(address, 2);

      allNfts = await this.getAllByAccount(kusamaAddress);

      if (allNfts.length <= 0) {
        return;
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
          externalUrl: item?.external_url as string,
          rarity: item?.metadata_rarity as string,
          collectionId: item?.collectionId as string,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          properties: item?.metadata?.properties as Record<any, any>,
          chain: this.chain,
          rmrk_ver: item.source && item.source === RMRK_SOURCE.SINGULAR_V1 ? RMRK_VER.VER_1 : RMRK_VER.VER_2,
          owner: item.owner as string
        } as NftItem;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        params.updateItem(this.chain, parsedItem, address);

        let url = '';

        if (item.source === RMRK_SOURCE.SINGULAR_V1) {
          url = SINGULAR_V1_COLLECTION_ENDPOINT + (item.collectionId as string);
        } else {
          url = SINGULAR_V2_COLLECTION_ENDPOINT + (item.collectionId as string);
        }

        if (!collectionInfoUrl.includes(url)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          allCollections.push({ chain: '', collectionId: item.collectionId });
          collectionInfoUrl.push(url.replace(' ', '%20'));
        }
      }

      const allCollectionMetaUrl: Record<string, any>[] = [];

      await Promise.all(collectionInfoUrl.map(async (url) => {
        try {
          const data = await fetch(url, {
            method: 'GET'
          })
            .then((resp) => resp.json()) as Record<string | number, string | number>[];
          const result = data[0];

          if (result && 'metadata' in result) {
            allCollectionMetaUrl.push({
              url: this.parseUrl(result?.metadata as string),
              id: result?.id
            });
          }

          if (data.length > 0) {
            return result;
          } else {
            return {};
          }
        } catch (e) {
          return {};
        }
      }));

      const allCollectionMeta: Record<string | number, any> = {};

      await Promise.all(allCollectionMetaUrl.map(async (item) => {
        let data: Record<string, any> = {};

        try {
          if (item.url) {
            data = await fetch(item?.url as string, {
              method: 'GET'
            })
              .then((resp) => resp.json()) as Record<string, any>;
          }

          if ('mediaUri' in data) { // rmrk v2.0
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            allCollectionMeta[item?.id as string] = { ...data, image: data.mediaUri };
          } else {
            allCollectionMeta[item?.id as string] = { ...data };
          }
        } catch (e) {
          console.error(item.url, e);
        }
      }));

      allCollections.forEach((item) => {
        const parsedCollection = {
          collectionId: item.collectionId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          collectionName: allCollectionMeta[item.collectionId] ? allCollectionMeta[item.collectionId].name as string : null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          image: allCollectionMeta[item.collectionId] ? this.parseUrl(allCollectionMeta[item.collectionId].image as string) : null,
          chain: this.chain
        } as NftCollection;

        const nftIds: string[] = [];

        allNfts.forEach((nft) => {
          const nftCollectionId = nft?.collectionId as string;

          if (nftCollectionId === item.collectionId) {
            nftIds.push(nft?.id as string);
          }
        });

        params.updateCollection(this.chain, parsedCollection);
      });
    } catch (e) {
      console.error(`${this.chain}`, e);
    }
  }

  public async handleNfts (params: HandleNftParams) {
    await Promise.all(this.addresses.map((address) => this.handleNft(address, params)));
  }

  public async fetchNfts (params: HandleNftParams): Promise<number> {
    try {
      await this.handleNfts(params);
    } catch (e) {
      return 0;
    }

    return 1;
  }
}
