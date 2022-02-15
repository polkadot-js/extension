// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'node-fetch';

import {NftCollection, NftItem} from '@polkadot/extension-base/background/KoniTypes';
import {isUrl, reformatAddress} from '@polkadot/extension-koni-base/utils/utils';

import {
  KANARIA_ENDPOINT,
  KANARIA_EXTERNAL_SERVER,
  PINATA_SERVER,
  SINGULAR_COLLECTION_ENDPOINT,
  SINGULAR_ENDPOINT,
  SINGULAR_EXTERNAL_SERVER
} from '../config';
import {BaseNftApi} from "@polkadot/extension-koni-base/api/nft/nft";

const headers = {
  'Content-Type': 'application/json'
};

export class RmrkNftApi extends BaseNftApi {

  constructor () {
    super();
  }

  override setAddresses(addresses: string[]) {
    super.setAddresses(addresses);
    let kusamaAddresses = []
    for (let address of this.addresses) {
      let kusamaAddress = reformatAddress(address, 2);
      kusamaAddresses.push(kusamaAddress);
    }

    this.addresses = kusamaAddresses;
  }

  override parseUrl(input: string): string | undefined {
    if (!input || input.length === 0) return undefined;

    if (!input.includes('ipfs://ipfs/')) { return PINATA_SERVER + input; }

    return PINATA_SERVER + input.split('ipfs://ipfs/')[1];
  }

  private getMetadata (metadata_url: string) {
    let url: string | undefined = metadata_url;

    if (!isUrl(metadata_url)) {
      url = this.parseUrl(metadata_url);
      if (!url || url.length === 0) return undefined;
    }

    return fetch(url, {
      method: 'GET',
      headers
    })
      .then((res) => res.json());
  };

  private async getSingularByAccount(account: string) {
    const url = SINGULAR_ENDPOINT + account;
    const data = await fetch(url, {
      method: 'GET',
      headers
    })
      .then((res) => res.json());

    let nfts: any[] = [];

    await Promise.all(data.map(async (item: any) => {
      const { animation_url, attributes, description, image, name } = await this.getMetadata(item.metadata);

      nfts.push({
        ...item,
        metadata: {
          description,
          name,
          attributes,
          animation_url: this.parseUrl(animation_url),
          image: this.parseUrl(image)
        },
        external_url: SINGULAR_EXTERNAL_SERVER + item.id
      });
    }));

    return nfts;
  }

  private async getItemsKanariaByAccount (account: string) {
    const url = KANARIA_ENDPOINT + 'account-items/' + account;
    const data = await fetch(url, {
      method: 'GET',
      headers
    })
      .then((res) => res.json());

    let nfts: any[] = [];

    await Promise.all(data.map(async (item: any) => {
      const result = await this.getMetadata(item.metadata);

      nfts.push({
        ...item,
        metadata: {
          ...result,
          image: this.parseUrl(result.image),
          external_url: KANARIA_EXTERNAL_SERVER + item.id
        }
      });
    }));

    return nfts;
  };

  private async getBirdsKanariaByAccount (account: string) {
    const url = KANARIA_ENDPOINT + 'account-birds/' + account;
    const data = await fetch(url, {
      method: 'GET',
      headers
    })
      .then((res) => res.json());

    let nfts: any[] = [];

    await Promise.all(data.map(async (item: any) => {
      const result = await this.getMetadata(item.metadata);

      nfts.push({
        ...item,
        metadata: result,
        external_url: KANARIA_EXTERNAL_SERVER + item.id
      });
    }));

    return nfts;
  };

  public async handleNfts() {
    const currentAddress = this.addresses[0];
    try {
      const [singular, birds, items] = await Promise.all([
        this.getSingularByAccount(currentAddress),
        this.getBirdsKanariaByAccount(currentAddress),
        this.getItemsKanariaByAccount(currentAddress)
      ]);
      const allNfts = [...singular, ...birds, ...items];
      let allCollections: any[] = [];
      const collectionInfoUrl: string[] = [];

      allNfts.map((item) => {
        const url = SINGULAR_COLLECTION_ENDPOINT + item.collectionId;

        if (!collectionInfoUrl.includes(url)) {
          allCollections.push({collectionId: item.collectionId});
          collectionInfoUrl.push(url);
        }
      });
      const allCollectionMetaUrl: any[] = [];
      const collectionInfo = await Promise.all(collectionInfoUrl.map(async (url) => {
        const resp = await fetch(url);
        const data: any[] = await resp.json();
        const result = data[0];

        if (result && 'metadata' in result) allCollectionMetaUrl.push({
          url: this.parseUrl(result?.metadata),
          id: result?.id
        });
        if (data.length > 0) return result;
        else return {};
      }));

      const allCollectionMeta = {};

      await Promise.all(allCollectionMetaUrl.map(async (item) => {
        const resp = await fetch(item.url);
        const data = await resp.json();

        // @ts-ignore
        allCollectionMeta[item?.id] = {...data};
      }));

      const collectionInfoDict = Object.assign({}, ...collectionInfo.map((item) => ({[item.id]: item.name})));
      const nftDict = {};

      for (const item of allNfts) {
        const parsedItem = {
          id: item?.id,
          name: item?.metadata?.name,
          image: item?.metadata?.image,
          description: item?.metadata?.description,
          external_url: item?.external_url,
          rarity: item?.metadata_rarity,
          collectionId: item?.collectionId,
          properties: item?.metadata?.properties
        } as NftItem;

        if (item.collectionId in nftDict) {
          // @ts-ignore
          nftDict[item.collectionId] = [...nftDict[item.collectionId], parsedItem];
        } else {
          // @ts-ignore
          nftDict[item.collectionId] = [parsedItem];
        }
      }

      allCollections = allCollections.map((item) => {
        return {
          collectionId: item.collectionId,
          collectionName: collectionInfoDict[item.collectionId] ? collectionInfoDict[item.collectionId] : null,
          // @ts-ignore
          image: allCollectionMeta[item.collectionId] ? this.parseUrl(allCollectionMeta[item.collectionId].image) : null,
          // @ts-ignore
          nftItems: nftDict[item.collectionId]
        } as NftCollection;
      });

      this.total = allNfts.length;
      this.data = allCollections;
    } catch (e) {
      console.error('Failed to fetch nft', e);
      throw e;
    }
  }
}
