// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, ContractType, CustomToken, NetworkJson, NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
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
  // General settings
  contractSupportedNetworkMap: Record<string, NetworkJson> = {};
  addresses: string[] = [];
  nftContracts: Record<string, CustomToken[]> = {};

  // Provider API needed
  dotSamaApiMap: Record<string, ApiProps> = {};
  web3ApiMap: Record<string, Web3> = {};

  // Logic handling
  handlers: BaseNftApi[] = []; // 1 chain can have multiple handlers (to support multiple token standards)
  total = 0;
  needSetupApi = true;

  setContractSupportedNetworkMap (contractSupportedNetworkMap: Record<string, NetworkJson>) {
    this.contractSupportedNetworkMap = contractSupportedNetworkMap;
    this.needSetupApi = true;
  }

  setWeb3ApiMap (web3ApiMap: Record<string, Web3>) {
    this.web3ApiMap = web3ApiMap;
    this.needSetupApi = true;
  }

  setDotSamaApiMap (dotSamaAPIMap: Record<string, ApiProps>) {
    this.dotSamaApiMap = dotSamaAPIMap;
    this.needSetupApi = true;
  }

  setAddresses (addresses: string[]) {
    this.addresses = addresses;

    const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

    for (const handler of this.handlers) {
      const useAddresses = handler.isEthereum ? evmAddresses : substrateAddresses;

      handler.setAddresses(useAddresses);
    }
  }

  private setupNftContracts (customTokens: CustomToken[]) {
    this.nftContracts = {};

    for (const contract of customTokens) {
      if (contract.chain in this.nftContracts) {
        this.nftContracts[contract.chain].push(contract);
      } else {
        this.nftContracts[contract.chain] = [contract];
      }
    }

    // TODO: consider classifying by token types as well
    for (const handler of this.handlers) {
      if (handler instanceof EvmNftApi) {
        handler.setEvmContracts(this.nftContracts[handler.chain]);
      } else if (handler instanceof WasmNftApi) {
        handler.setWasmContracts(this.nftContracts[handler.chain]);
      }
    }
  }

  private setupApi () {
    try {
      if (this.needSetupApi) { // setup connections for first time use
        this.handlers = [];
        const [substrateAddresses, evmAddresses] = categoryAddresses(this.addresses);

        for (const chain in SUPPORTED_NFT_NETWORKS) { // create handlers for default networks
          if (this.dotSamaApiMap[chain]) {
            const handler = createSubstrateNftApi(chain, this.dotSamaApiMap[chain], substrateAddresses);

            if (handler) {
              this.handlers.push(handler);
            }
          }
        }

        // TODO: 1 network might support WASM, EVM and more
        Object.entries(this.contractSupportedNetworkMap).forEach(([chain, networkJson]) => {
          if (networkJson.supportSmartContract && networkJson.supportSmartContract.includes(ContractType.evm)) {
            if (this.web3ApiMap[chain]) {
              const handler = createWeb3NftApi(chain, this.web3ApiMap[chain], evmAddresses);

              if (handler) {
                this.handlers.push(handler);
              }
            }
          } else if (networkJson.supportSmartContract && networkJson.supportSmartContract.includes(ContractType.wasm)) {
            if (this.dotSamaApiMap[chain]) {
              const handler = createWasmNftApi(chain, this.dotSamaApiMap[chain], substrateAddresses);

              if (handler && !this.handlers.includes(handler)) {
                this.handlers.push(handler);
              }
            }
          }
        });

        this.needSetupApi = false;
        // console.log(`${this.handlers.length} nft handlers connected`, this.handlers);
      }
    } catch (e) {
      console.error('error setting up nft handlers', e);
    }
  }

  public async handleNfts (
    nftContracts: CustomToken[],
    updateItem: (chain: string, data: NftItem, owner: string) => void,
    updateCollection: (chain: string, data: NftCollection) => void,
    updateIds: (chain: string, owner: string, collectionId?: string, nftIds?: string[]) => void,
    updateCollectionIds: (chain: string, address: string, collectionIds?: string[]) => void) {
    this.setupApi();
    this.setupNftContracts(nftContracts);
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
