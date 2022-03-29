// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NftCollection, NftItem, NftJson } from '@polkadot/extension-base/background/KoniTypes';
import { ethereumChains } from '@polkadot/extension-koni-base/api/dotsama/api-helper';
import { AcalaNftApi } from '@polkadot/extension-koni-base/api/nft/acala_nft';
import { SUPPORTED_NFT_NETWORKS } from '@polkadot/extension-koni-base/api/nft/config';
import { Web3NftApi } from '@polkadot/extension-koni-base/api/nft/eth_nft';
import { KaruraNftApi } from '@polkadot/extension-koni-base/api/nft/karura_nft';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';
import QuartzNftApi from '@polkadot/extension-koni-base/api/nft/quartz_nft';
import { RmrkNftApi } from '@polkadot/extension-koni-base/api/nft/rmrk_nft';
import StatemineNftApi from '@polkadot/extension-koni-base/api/nft/statemine_nft';
import UniqueNftApi from '@polkadot/extension-koni-base/api/nft/unique_nft';
import { categoryAddresses, isAddressesEqual } from '@polkadot/extension-koni-base/utils/utils';

const NFT_FETCHING_TIMEOUT = 20000;

function createNftApi (chain: string, api: ApiProps | null, addresses: string[]): BaseNftApi | null {
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
    case SUPPORTED_NFT_NETWORKS.moonbeam:
      return new Web3NftApi(useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.moonriver:
      return new Web3NftApi(useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.astar:
      return new Web3NftApi(useAddresses, chain);
  }

  return null;
}

export class NftHandler {
  count = 0;
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

  private setupApi () {
    try {
      if (this.handlers.length <= 0) { // setup connections for first time use
        const [substrateAddresses, evmAddresses] = categoryAddresses(this.addresses);

        this.apiPromises.forEach(({ api: apiPromise, chain }) => {
          const useAddresses = ethereumChains.indexOf(chain as string) > -1 ? evmAddresses : substrateAddresses;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const handler = createNftApi(chain, apiPromise as ApiProps, useAddresses);

          if (handler && !this.handlers.includes(handler)) {
            this.handlers.push(handler);
          }
        });

        console.log(`${this.handlers.length} nft handlers setup done`);
      } else { console.log('nft handlers already setup.'); }
    } catch (e) {
      console.log('error setting up nft handlers', e);
    }
  }

  private sortData (data: NftCollection[]) {
    const sortedData = this.data;

    for (const collection of data) {
      if (!this.data.some((e) => e.collectionName === collection.collectionName && e.collectionId === collection.collectionId)) {
        sortedData.push(collection);
      }
    }

    return sortedData;
  }

  public async handleNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void) {
    const start = performance.now();

    let total = 0;
    const dataMap: Record<string, NftCollection[]> = {};

    this.setupApi();

    await Promise.all(this.handlers.map(async (handler) => {
      const currentChain = handler.getChain() as string;

      const timeout = new Promise((resolve, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          resolve(0);
        }, NFT_FETCHING_TIMEOUT);
      });

      await Promise.race([
        handler.fetchNfts(updateItem, updateCollection),
        timeout
      ]).then((res) => {
        if (res === 1) {
          total += handler.getTotal();
          dataMap[currentChain] = handler.getData();
        } else {
          console.log(`nft fetching for ${currentChain} failed`);
        }
      });
    }));

    // console.log('nft dataMap', dataMap);
    let data: NftCollection[] = [];

    Object.values(dataMap).forEach((collection) => {
      data = [...data, ...collection];
    });

    // TODO: clear outdated item

    if (isAddressesEqual(this.addresses, this.prevAddresses)) {
      // console.log('nft address no change');

      if (total < this.total) {
        this.total = total;
        this.data = data;
      } else {
        this.total = total;
        this.data = this.sortData(data);
      }
    } else {
      // console.log('nft address change');
      this.total = total;
      this.data = data;
      this.prevAddresses = this.addresses;
    }

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
