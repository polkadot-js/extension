// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NftCollection, NftJson } from '@polkadot/extension-base/background/KoniTypes';
import { ethereumChains } from '@polkadot/extension-koni-base/api/dotsama/api-helper';
import { AcalaNftApi } from '@polkadot/extension-koni-base/api/nft/acala_nft';
import { KaruraNftApi } from '@polkadot/extension-koni-base/api/nft/karura_nft';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';
import QuartzNftApi from '@polkadot/extension-koni-base/api/nft/quartz_nft';
import { RmrkNftApi } from '@polkadot/extension-koni-base/api/nft/rmrk_nft';
import StatemineNftApi from '@polkadot/extension-koni-base/api/nft/statemine_nft';
import UniqueNftApi from '@polkadot/extension-koni-base/api/nft/unique_nft';
import { categoryAddresses, isAddressesEqual } from '@polkadot/extension-koni-base/utils/utils';

const NFT_TIMEOUT = 10000;

enum SUPPORTED_NFT_NETWORKS {
  karura = 'karura',
  acala = 'acala',
  rmrk = 'rmrk',
  statemine = 'statemine',
  uniqueNft = 'uniqueNft',
  quartz = 'quartz'
}

function createNftApi (chain: string, api: ApiProps, addresses: string[]): BaseNftApi | null {
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);
  const useAddresses = ethereumChains.indexOf(chain) > -1 ? evmAddresses : substrateAddresses;

  switch (chain) {
    case SUPPORTED_NFT_NETWORKS.karura:
      return new KaruraNftApi(api, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.acala:
      return new AcalaNftApi(api, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.rmrk:
      // eslint-disable-next-line no-case-declarations
      const rmrkNftApi = new RmrkNftApi();

      rmrkNftApi.setChain(SUPPORTED_NFT_NETWORKS.rmrk);
      rmrkNftApi.setAddresses(useAddresses);

      return rmrkNftApi;
    case SUPPORTED_NFT_NETWORKS.statemine:
      return new StatemineNftApi(api, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.uniqueNft:
      return new UniqueNftApi(api, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.quartz:
      return new QuartzNftApi(api, useAddresses, chain);
  }

  return null;
}

export class NftHandler {
  count: number = 0;
  apiPromises: Record<string, any>[] = [];
  handlers: BaseNftApi[] = [];
  addresses: string[] = [];
  prevAddresses: string[] = []; // handle change account
  total = 0;
  data: NftCollection[] = [];

  constructor (dotSamaAPIMap: Record<string, ApiProps>, addresses?: string[]) {
    if (addresses) this.addresses = addresses;

    for (const item in SUPPORTED_NFT_NETWORKS) {
      this.apiPromises.push({ chain: item, api: dotSamaAPIMap[item] });
    }
  }

  setAddresses (addresses: string[]) {
    this.addresses = addresses;
    if (this.prevAddresses.length === 0) this.prevAddresses = addresses;

    const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

    for (const handler of this.handlers) {
      const useAddresses = ethereumChains.indexOf(handler.chain as string) > -1 ? evmAddresses : substrateAddresses;

      handler.setAddresses(useAddresses);
    }
  }

  private sortData (data: NftCollection[]) {
    const sortedData = this.data;

    for (const collection of data) {
      if (!this.data.some((e) => e.collectionName === collection.collectionName && e.image === collection.image && e.collectionId === collection.collectionId)) {
        sortedData.push(collection);
      }
    }

    return sortedData;
  }

  private async connect () {
    if (this.handlers.length > 0) {
      await Promise.all(this.handlers.map(async (handler) => {
        await handler.connect();
      }));
    } else {
      const [substrateAddresses, evmAddresses] = categoryAddresses(this.addresses);

      await Promise.all(this.apiPromises.map(async ({ api: apiPromise, chain }) => {
        const useAddresses = ethereumChains.indexOf(chain as string) > -1 ? evmAddresses : substrateAddresses;

        if (apiPromise) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          const parentApi: ApiProps = await apiPromise.isReady;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const handler = createNftApi(chain, parentApi, useAddresses);

          if (handler && !this.handlers.includes(handler)) this.handlers.push(handler);
        }
      }));
    }
  }

  public async handleNfts () {
    const startConnect = performance.now();

    await this.connect();
    console.log(`nft connect took ${performance.now() - startConnect}ms`);

    console.log(`fetching nft from ${this.handlers.length} chains`, this.addresses);
    const start = performance.now();

    let total = 0;
    let data: NftCollection[] = [];

    await Promise.all(this.handlers.map(async (handler) => {
      const timeout = new Promise((resolve, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          resolve('Timed out.');
        }, NFT_TIMEOUT);
      });

      await Promise.race([
        handler.handleNfts(),
        timeout
      ]).then((e) => console.log('nft race', e));

      console.log(`total ${handler.getChain() as string}`, handler.getTotal());

      total += handler.getTotal();
      data = [...data, ...handler.getData()];
    }));

    if (isAddressesEqual(this.addresses, this.prevAddresses)) {
      // console.log('nft address no change');
      if (total < this.total) this.data = data;
      else this.data = this.sortData(data);
    } else {
      // console.log('nft address change');
      this.data = data;
      this.prevAddresses = this.addresses;
    }

    this.total = total;

    console.log(`all nft took ${performance.now() - start}ms`);

    console.log(`done fetching ${total} nft from rpc`);
  }

  public getTotal () {
    return this.total;
  }

  public getNfts () {
    return this.data;
  }

  public getNftJson () {
    return {
      ready: true,
      total: this.total,
      nftList: this.data
    } as NftJson;
  }

  public parseAssetId (id: string) {
    const numberId = parseInt(id);

    return numberId.toString();
  }
}
