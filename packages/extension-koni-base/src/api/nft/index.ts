// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { ethereumChains } from '@polkadot/extension-koni-base/api/dotsama/api-helper';
import { AcalaNftApi } from '@polkadot/extension-koni-base/api/nft/acala_nft';
import { BitCountryNftApi } from '@polkadot/extension-koni-base/api/nft/bit.country';
import { SUPPORTED_NFT_NETWORKS } from '@polkadot/extension-koni-base/api/nft/config';
import { Web3NftApi } from '@polkadot/extension-koni-base/api/nft/eth_nft';
import { KaruraNftApi } from '@polkadot/extension-koni-base/api/nft/karura_nft';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';
import { RmrkNftApi } from '@polkadot/extension-koni-base/api/nft/rmrk_nft';
import StatemineNftApi from '@polkadot/extension-koni-base/api/nft/statemine_nft';
import UniqueNftApi from '@polkadot/extension-koni-base/api/nft/unique_nft';
import { state } from '@polkadot/extension-koni-base/background/handlers';
import { categoryAddresses } from '@polkadot/extension-koni-base/utils/utils';

function createNftApi (chain: string, api: ApiProps | null, addresses: string[]): BaseNftApi | null {
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);
  const useAddresses = ethereumChains.indexOf(chain) > -1 ? evmAddresses : substrateAddresses;

  switch (chain) {
    case SUPPORTED_NFT_NETWORKS.karura:
      return new KaruraNftApi(api, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.acala:
      return new AcalaNftApi(api, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.kusama:
      // eslint-disable-next-line no-case-declarations
      const rmrkNftApi = new RmrkNftApi();

      rmrkNftApi.setChain(SUPPORTED_NFT_NETWORKS.kusama);
      rmrkNftApi.setAddresses(useAddresses);

      return rmrkNftApi;
    case SUPPORTED_NFT_NETWORKS.statemine:
      return new StatemineNftApi(api, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.uniqueNft:
      return new UniqueNftApi(api, useAddresses, chain);
    // case SUPPORTED_NFT_NETWORKS.quartz:
    //   return new QuartzNftApi(api, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.bitcountry:
      return new BitCountryNftApi(api, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.moonbeam:
      return new Web3NftApi(useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.moonriver:
      return new Web3NftApi(useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.astarEvm:
      return new Web3NftApi(useAddresses, chain);
  }

  return null;
}

export class NftHandler {
  apiProps: Record<string, any>[] = [];
  handlers: BaseNftApi[] = [];
  addresses: string[] = [];
  total = 0;

  constructor (dotSamaAPIMap: Record<string, ApiProps>, addresses?: string[]) {
    if (addresses) {
      this.addresses = addresses;
    }

    for (const item in SUPPORTED_NFT_NETWORKS) {
      this.apiProps.push({ chain: item, api: dotSamaAPIMap[item] });
    }
  }

  setApiProps (dotSamaAPIMap: Record<string, ApiProps>) {
    const _apiProps: Record<string, any>[] = [];

    for (const item in SUPPORTED_NFT_NETWORKS) {
      if (item in dotSamaAPIMap) {
        _apiProps.push({ chain: item, api: dotSamaAPIMap[item] });
      }
    }

    this.apiProps = _apiProps;
  }

  setAddresses (addresses: string[]) {
    this.addresses = addresses;
    // if (this.prevAddresses.length === 0) this.prevAddresses = addresses;

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

        this.apiProps.forEach(({ api: apiPromise, chain }) => {
          const useAddresses = ethereumChains.indexOf(chain as string) > -1 ? evmAddresses : substrateAddresses;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const handler = createNftApi(chain, apiPromise as ApiProps, useAddresses);

          if (handler && !this.handlers.includes(handler)) {
            this.handlers.push(handler);
          }
        });

        // console.log(`${this.handlers.length} nft connected`);
      }
    } catch (e) {
      console.error('error setting up nft handlers', e);
    }
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

  public async handleNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void) {
    this.setupApi();

    await Promise.all(this.handlers.map(async (handler) => {
      await handler.fetchNfts(
        (data: NftItem) => {
          if (!this.existItem(data)) {
            updateItem(data);
          }
        },
        (data: NftCollection) => {
          if (!this.existCollection(data)) {
            updateCollection(data);
          }
        },
        updateReady);
    }));
  }

  public parseAssetId (id: string) {
    const numberId = parseInt(id);

    return numberId.toString();
  }
}
