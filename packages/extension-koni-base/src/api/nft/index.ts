// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, CustomEvmToken, NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { ethereumChains } from '@subwallet/extension-koni-base/api/dotsama/api-helper';
import { AcalaNftApi } from '@subwallet/extension-koni-base/api/nft/acala_nft';
import { BitCountryNftApi } from '@subwallet/extension-koni-base/api/nft/bit.country';
import { EvmContracts, SUPPORTED_NFT_NETWORKS } from '@subwallet/extension-koni-base/api/nft/config';
import { Web3NftApi } from '@subwallet/extension-koni-base/api/nft/eth_nft';
import { KaruraNftApi } from '@subwallet/extension-koni-base/api/nft/karura_nft';
import { BaseNftApi } from '@subwallet/extension-koni-base/api/nft/nft';
import { RmrkNftApi } from '@subwallet/extension-koni-base/api/nft/rmrk_nft';
import StatemineNftApi from '@subwallet/extension-koni-base/api/nft/statemine_nft';
import UniqueNftApi from '@subwallet/extension-koni-base/api/nft/unique_nft';
import { state } from '@subwallet/extension-koni-base/background/handlers';
import { categoryAddresses } from '@subwallet/extension-koni-base/utils/utils';

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
    // case SUPPORTED_NFT_NETWORKS.quartz:
    //   return new QuartzNftApi(api, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.bitcountry:
      return new BitCountryNftApi(api, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.moonbeam:
      return new Web3NftApi(useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.moonriver:
      return new Web3NftApi(useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.moonbase:
      return new Web3NftApi(useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.astarEvm:
      return new Web3NftApi(useAddresses, chain);
  }

  return null;
}

export class NftHandler {
  apiPromises: Record<string, any>[] = [];
  handlers: BaseNftApi[] = [];
  addresses: string[] = [];
  total = 0;
  evmContracts: EvmContracts = {
    astarEvm: [],
    moonbase: [],
    moonbeam: [],
    moonriver: [],
    shidenEvm: []
  };

  constructor (dotSamaAPIMap: Record<string, ApiProps>, addresses?: string[]) {
    if (addresses) {
      this.addresses = addresses;
    }

    for (const item in SUPPORTED_NFT_NETWORKS) {
      this.apiPromises.push({ chain: item, api: dotSamaAPIMap[item] });
    }
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

  private setEvmContracts (evmContracts: CustomEvmToken[]) {
    this.evmContracts = {
      astarEvm: [],
      moonbase: [],
      moonbeam: [],
      moonriver: [],
      shidenEvm: []
    };

    for (const contract of evmContracts) {
      this.evmContracts[contract.chain].push(contract);
    }

    for (const handler of this.handlers) {
      if (handler instanceof Web3NftApi && handler.chain === 'astarEvm') {
        handler.setEvmContracts(this.evmContracts.astarEvm);
      } else if (handler instanceof Web3NftApi && handler.chain === 'moonbeam') {
        handler.setEvmContracts(this.evmContracts.moonbeam);
      } else if (handler instanceof Web3NftApi && handler.chain === 'moonriver') {
        handler.setEvmContracts(this.evmContracts.moonriver);
      } else if (handler instanceof Web3NftApi && handler.chain === 'moonbase') {
        handler.setEvmContracts(this.evmContracts.moonbase);
      }
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

  public async handleNfts (evmContracts: CustomEvmToken[], updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void) {
    this.setupApi();
    this.setEvmContracts(evmContracts);

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
