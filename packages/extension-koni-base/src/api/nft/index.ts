// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, CustomEvmToken, NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { AcalaNftApi } from '@subwallet/extension-koni-base/api/nft/acala_nft';
import { BitCountryNftApi } from '@subwallet/extension-koni-base/api/nft/bit.country';
import { SUPPORTED_NFT_NETWORKS } from '@subwallet/extension-koni-base/api/nft/config';
import { Web3NftApi } from '@subwallet/extension-koni-base/api/nft/eth_nft';
import { KaruraNftApi } from '@subwallet/extension-koni-base/api/nft/karura_nft';
import { BaseNftApi } from '@subwallet/extension-koni-base/api/nft/nft';
import { RmrkNftApi } from '@subwallet/extension-koni-base/api/nft/rmrk_nft';
import StatemineNftApi from '@subwallet/extension-koni-base/api/nft/statemine_nft';
import UniqueNftApi from '@subwallet/extension-koni-base/api/nft/unique_nft';
import { categoryAddresses } from '@subwallet/extension-koni-base/utils/utils';
import Web3 from 'web3';

function createSubstrateNftApi (chain: string, apiProps: ApiProps | null, addresses: string[]): BaseNftApi | null {
  // @ts-ignore
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);
  const useAddresses = substrateAddresses;

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
  // @ts-ignore
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  return new Web3NftApi(web3, evmAddresses, chain);
}

// TODO: race apiProps.isReady against a timeout, if timeout then read data from store (to be done after implementing light client and migrate use of full node connection)
export class NftHandler {
  apiProps: Record<string, any>[] = [];
  web3ApiMap: Record<string, Web3> = {};
  handlers: BaseNftApi[] = [];
  addresses: string[] = [];
  total = 0;
  needSetupApi = true;
  evmContracts: Record<string, CustomEvmToken[]> = {};

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
      const useAddresses = handler.isEthereum ? evmAddresses : substrateAddresses;

      handler.setAddresses(useAddresses);
    }
  }

  private setEvmContracts (evmContracts: CustomEvmToken[]) {
    this.evmContracts = {};

    for (const contract of evmContracts) {
      if (contract.chain in this.evmContracts) {
        this.evmContracts[contract.chain].push(contract);
      } else {
        this.evmContracts[contract.chain] = [contract];
      }
    }

    for (const handler of this.handlers) {
      if (handler instanceof Web3NftApi) {
        handler.setEvmContracts(this.evmContracts[handler.chain]);
      }
    }
  }

  private setupApi () {
    try {
      if (this.needSetupApi) { // setup connections for first time use
        this.handlers = [];
        const [substrateAddresses, evmAddresses] = categoryAddresses(this.addresses);

        this.apiProps.forEach(({ api: apiPromise, chain }) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const handler = createSubstrateNftApi(chain, apiPromise as ApiProps, substrateAddresses);

          if (handler && !this.handlers.includes(handler)) {
            this.handlers.push(handler);
          }
        });

        Object.entries(this.web3ApiMap).forEach(([chain, web3]) => {
          const handler = createWeb3NftApi(chain, web3, evmAddresses);

          if (handler && !this.handlers.includes(handler)) {
            this.handlers.push(handler);
          }
        });

        this.needSetupApi = false;
        // console.log(`${this.handlers.length} nft connected`, this.handlers);
      }
    } catch (e) {
      console.error('error setting up nft handlers', e);
    }
  }

  public async handleNfts (
    evmContracts: CustomEvmToken[],
    updateItem: (data: NftItem) => void,
    updateCollection: (data: NftCollection) => void,
    updateReady: (ready: boolean) => void,
    updateIds: (networkKey: string, collectionId?: string, nftIds?: string[]) => void) {
    this.setupApi();
    this.setEvmContracts(evmContracts);
    await Promise.all(this.handlers.map(async (handler) => {
      await handler.fetchNfts({
        updateItem: (data: NftItem) => {
          updateItem(data);
        },
        updateCollection: (data: NftCollection) => {
          updateCollection(data);
        },
        updateReady,
        updateNftIds: updateIds
      });
    }));

    updateReady(true);
  }

  public parseAssetId (id: string) {
    const numberId = parseInt(id);

    return numberId.toString();
  }
}
