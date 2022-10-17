// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, CustomToken, NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { AcalaNftApi } from '@subwallet/extension-koni-base/api/nft/acala_nft';
import { BitCountryNftApi } from '@subwallet/extension-koni-base/api/nft/bit.country';
import { SUPPORTED_NFT_NETWORKS } from '@subwallet/extension-koni-base/api/nft/config';
import { EvmNftApi } from '@subwallet/extension-koni-base/api/nft/evm_nft';
import { KaruraNftApi } from '@subwallet/extension-koni-base/api/nft/karura_nft';
import { BaseNftApi } from '@subwallet/extension-koni-base/api/nft/nft';
import { RmrkNftApi } from '@subwallet/extension-koni-base/api/nft/rmrk_nft';
import StatemineNftApi from '@subwallet/extension-koni-base/api/nft/statemine_nft';
import UniqueNftApi from '@subwallet/extension-koni-base/api/nft/unique_nft';
import { WasmNftApi } from '@subwallet/extension-koni-base/api/nft/wasm_nft';
import { categoryAddresses } from '@subwallet/extension-koni-base/utils';
import Web3 from 'web3';

function createSubstrateNftApi (chain: string, apiProps: ApiProps | null, addresses: string[]): BaseNftApi | null {
  const [substrateAddresses] = categoryAddresses(addresses);

  switch (chain) {
    case SUPPORTED_NFT_NETWORKS.karura:
      return new KaruraNftApi(apiProps, substrateAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.acala:
      return new AcalaNftApi(apiProps, substrateAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.kusama:
      return new RmrkNftApi(apiProps, substrateAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.statemine:
      return new StatemineNftApi(apiProps, substrateAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.unique_network:
      return new UniqueNftApi(apiProps, substrateAddresses, chain);
    // case SUPPORTED_NFT_NETWORKS.quartz:
    //   return new QuartzNftApi(api, substrateAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.bitcountry:
      return new BitCountryNftApi(apiProps, substrateAddresses, chain);
    case SUPPORTED_NFT_NETWORKS.pioneer:
      return new BitCountryNftApi(apiProps, substrateAddresses, chain);
  }

  return null;
}

function createWasmNftApi (chain: string, apiProps: ApiProps | null, addresses: string[]): BaseNftApi | null {
  const [substrateAddresses] = categoryAddresses(addresses);

  return new WasmNftApi(apiProps, substrateAddresses, chain);
}

function createWeb3NftApi (chain: string, web3: Web3 | null, addresses: string[]): BaseNftApi | null {
  const [, evmAddresses] = categoryAddresses(addresses);

  return new EvmNftApi(web3, evmAddresses, chain);
}

export class NftHandler {
  apiProps: Record<string, any>[] = [];
  web3ApiMap: Record<string, Web3> = {};
  handlers: BaseNftApi[] = [];
  addresses: string[] = [];
  total = 0;
  needSetupApi = true;
  evmContracts: Record<string, CustomToken[]> = {};

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

  private setEvmContracts (evmContracts: CustomToken[]) {
    this.evmContracts = {};

    for (const contract of evmContracts) {
      if (contract.chain in this.evmContracts) {
        this.evmContracts[contract.chain].push(contract);
      } else {
        this.evmContracts[contract.chain] = [contract];
      }
    }

    for (const handler of this.handlers) {
      if (handler instanceof EvmNftApi) {
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
    evmContracts: CustomToken[],
    updateItem: (chain: string, data: NftItem, owner: string) => void,
    updateCollection: (chain: string, data: NftCollection) => void,
    updateIds: (chain: string, owner: string, collectionId?: string, nftIds?: string[]) => void,
    updateCollectionIds: (chain: string, address: string, collectionIds?: string[]) => void) {
    this.setupApi();
    this.setEvmContracts(evmContracts);
    await Promise.all(this.handlers.map(async (handler) => {
      await handler.fetchNfts({
        updateItem,
        updateCollection,
        updateNftIds: updateIds,
        updateCollectionIds
      });
    }));
  }

  public parseAssetId (id: string) {
    const numberId = parseInt(id);

    return numberId.toString();
  }
}
