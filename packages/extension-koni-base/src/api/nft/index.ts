// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Web3 from 'web3';

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

function createSubstrateNftApi (chain: string, apiProps: ApiProps | null, addresses: string[]): BaseNftApi | null {
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);
  const useAddresses = ethereumChains.indexOf(chain) > -1 ? evmAddresses : substrateAddresses;

  switch (chain) {
    case SUPPORTED_NFT_NETWORKS.karura:
      return new KaruraNftApi(apiProps, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.acala:
      return new AcalaNftApi(apiProps, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.kusama:
      // eslint-disable-next-line no-case-declarations
      const rmrkNftApi = new RmrkNftApi();

      rmrkNftApi.setChain(SUPPORTED_NFT_NETWORKS.kusama);
      rmrkNftApi.setAddresses(useAddresses);

      return rmrkNftApi;
    case SUPPORTED_NFT_NETWORKS.statemine:
      return new StatemineNftApi(apiProps, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.uniqueNft:
      return new UniqueNftApi(apiProps, useAddresses, chain);
    // case SUPPORTED_NFT_NETWORKS.quartz:
    //   return new QuartzNftApi(api, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.bitcountry:
      return new BitCountryNftApi(apiProps, useAddresses, chain);
  }

  return null;
}

function createWeb3NftApi (chain: string, web3: Web3 | null, addresses: string[]): BaseNftApi | null {
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);
  const useAddresses = ethereumChains.indexOf(chain) > -1 ? evmAddresses : substrateAddresses;

  switch (chain) {
    case SUPPORTED_NFT_NETWORKS.moonbeam:
      return new Web3NftApi(web3, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.moonriver:
      return new Web3NftApi(web3, useAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.astarEvm:
      return new Web3NftApi(web3, useAddresses, chain);
  }

  return null;
}

export class NftHandler {
  apiProps: Record<string, any>[] = [];
  web3ApiMap: Record<string, Web3> = {};
  handlers: BaseNftApi[] = [];
  addresses: string[] = [];
  total = 0;
  needSetupApi = true;

  // TODO: process change handlers (add, delete)
  // TODO: pass web3 api

  constructor (dotSamaAPIMap: Record<string, ApiProps>, addresses?: string[], web3ApiMap?: Record<string, Web3>) {
    if (addresses) {
      this.addresses = addresses;
    }

    for (const item in SUPPORTED_NFT_NETWORKS) {
      this.apiProps.push({ chain: item, api: dotSamaAPIMap[item] });
    }

    if (web3ApiMap) {
      this.web3ApiMap = web3ApiMap;
    }
  }

  setWeb3ApiMap (web3ApiMap: Record<string, Web3>) {
    this.web3ApiMap = web3ApiMap;
    this.needSetupApi = true;
  }

  setApiProps (dotSamaAPIMap: Record<string, ApiProps>) {
    const _apiProps: Record<string, any>[] = [];

    for (const item in SUPPORTED_NFT_NETWORKS) {
      if (item in dotSamaAPIMap) {
        _apiProps.push({ chain: item, api: dotSamaAPIMap[item] });
      }
    }

    this.apiProps = _apiProps;
    this.needSetupApi = true;
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
      if (this.needSetupApi) { // setup connections for first time use
        this.handlers = [];
        const [substrateAddresses, evmAddresses] = categoryAddresses(this.addresses);

        this.apiProps.forEach(({ api: apiPromise, chain }) => {
          const useAddresses = ethereumChains.indexOf(chain as string) > -1 ? evmAddresses : substrateAddresses;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const handler = createSubstrateNftApi(chain, apiPromise as ApiProps, useAddresses);

          if (handler && !this.handlers.includes(handler)) {
            this.handlers.push(handler);
          }
        });

        Object.entries(this.web3ApiMap).forEach(([chain, web3]) => {
          const useAddresses = ethereumChains.indexOf(chain) > -1 ? evmAddresses : substrateAddresses;
          const handler = createWeb3NftApi(chain, web3, useAddresses);

          if (handler && !this.handlers.includes(handler)) {
            this.handlers.push(handler);
          }
        });

        this.needSetupApi = false;
        console.log(`${this.handlers.length} nft connected`, this.handlers);
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
