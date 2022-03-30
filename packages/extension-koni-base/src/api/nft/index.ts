// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
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
import { state } from '@polkadot/extension-koni-base/background/handlers';

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
  allCollections: NftCollection[] = [];
  allItems: NftItem[] = [];

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
    const sortedData = this.allCollections;

    for (const collection of data) {
      if (!this.allCollections.some((e) => e.collectionName === collection.collectionName && e.collectionId === collection.collectionId)) {
        sortedData.push(collection);
      }
    }

    return sortedData;
  }

  private existCollection (newCollection: NftCollection) {
    return state.getNftCollection().nftCollectionList.some((collection) =>
      collection.chain === newCollection.chain &&
      collection.collectionId === newCollection.collectionId &&
      collection.collectionName === newCollection.collectionName);
  }

  private existItem (newItem: NftItem) {
    return state.getNft().nftList.some((item) =>
      item.chain === newItem.chain &&
      item.id === newItem.id &&
      item.collectionId === newItem.collectionId &&
      item.name === newItem.name);
  }

  public async handleNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection | null, ready: boolean) => void) {
    let total = 0;
    const dataMap: Record<string, NftCollection[]> = {};

    this.setupApi();

    await Promise.all(this.handlers.map(async (handler) => {
      const currentChain = handler.getChain() as string;

      const timeout = new Promise((resolve) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          resolve(0);
        }, NFT_FETCHING_TIMEOUT);
      });

      await Promise.race([
        handler.fetchNfts(
          (data: NftItem) => {
            if (!this.existItem(data)) {
              this.allItems.push(data);
              updateItem(data);
            }
          },
          (data: NftCollection) => {
            if (!this.existCollection(data)) {
              this.allCollections.push(data);
              updateCollection(data, true);
            } else {
              updateCollection(null, true);
            }
          }),
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

    let data: NftCollection[] = [];

    Object.values(dataMap).forEach((collection) => {
      data = [...data, ...collection];
    });

    // TODO: clear outdated item

    if (isAddressesEqual(this.addresses, this.prevAddresses)) {
      // console.log('nft address no change');

      if (total < this.total) {
        this.total = total;
        this.allCollections = data;
      } else {
        this.total = total;
        this.allCollections = this.sortData(data);
      }
    } else {
      // console.log('nft address change');
      this.total = total;
      this.allCollections = data;
      this.prevAddresses = this.addresses;
    }
  }

  public getTotal () {
    return this.total;
  }

  public getNfts () {
    return this.allCollections;
  }

  public parseAssetId (id: string) {
    const numberId = parseInt(id);

    return numberId.toString();
  }
}
