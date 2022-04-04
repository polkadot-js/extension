// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'cross-fetch';
import Web3 from 'web3';

import { NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { EVM_NETWORKS } from '@polkadot/extension-koni-base/api/endpoints';
import { RMRK_PINATA_SERVER, SUPPORTED_NFT_NETWORKS } from '@polkadot/extension-koni-base/api/nft/config';
import { ASTAR_SUPPORTED_NFT_CONTRACTS, ContractInfo, MOONBEAM_SUPPORTED_NFT_CONTRACTS, MOONRIVER_SUPPORTED_NFT_CONTRACTS } from '@polkadot/extension-koni-base/api/nft/eth_nft/utils';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';
import { ERC721Contract, TestERC721Contract } from '@polkadot/extension-koni-base/api/web3/web3';
import { isUrl } from '@polkadot/extension-koni-base/utils/utils';
import { isEthereumAddress } from '@polkadot/util-crypto';

export class Web3NftApi extends BaseNftApi {
  web3: Web3 | null = null;
  targetContracts: ContractInfo[] | undefined;

  constructor (addresses: string[], chain: string) {
    super(undefined, addresses, chain);

    if (chain === SUPPORTED_NFT_NETWORKS.moonbeam) this.targetContracts = MOONBEAM_SUPPORTED_NFT_CONTRACTS;
    else if (chain === SUPPORTED_NFT_NETWORKS.moonriver) this.targetContracts = MOONRIVER_SUPPORTED_NFT_CONTRACTS;
    else if (chain === SUPPORTED_NFT_NETWORKS.astar) this.targetContracts = ASTAR_SUPPORTED_NFT_CONTRACTS;
  }

  connectWeb3 () {
    this.web3 = new Web3(new Web3.providers.WebsocketProvider(EVM_NETWORKS[this.chain as string].provider));
  }

  override parseUrl (input: string): string | undefined {
    if (!input) return undefined;

    if (isUrl(input)) return input;

    if (input.includes('ipfs://')) {
      return RMRK_PINATA_SERVER + input.split('ipfs://')[1];
    }

    return RMRK_PINATA_SERVER + input.split('ipfs://ipfs/')[1];
  }

  private parseMetadata (data: Record<string, any>): NftItem {
    const traitList = data.traits ? data.traits as Record<string, any>[] : data.attributes as Record<string, any>[];
    const propertiesMap: Record<string, any> = {};

    if (traitList) {
      traitList.forEach((traitMap) => {
        propertiesMap[traitMap.trait_type as string] = {
          value: traitMap.value as string
          // rarity: traitMap.trait_count / itemTotal
        };
      });
    }

    // extra fields
    if (data.dna) {
      propertiesMap.dna = {
        value: data.dna as string
      };
    }

    if (data.compiler) {
      propertiesMap.compiler = {
        value: data.compiler as string
      };
    }

    return {
      id: data.token_id ? data.token_id as string : data.edition as string,
      name: data.name as string | undefined,
      image: data.image_url ? this.parseUrl(data.image_url as string) : this.parseUrl(data.image as string),
      description: data.description as string | undefined,
      properties: propertiesMap,
      external_url: data.external_url as string | undefined,
      chain: this.chain
    } as NftItem;
  }

  private async getItemsByCollection (smartContract: string, collectionName: string, updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void) {
    if (!this.web3) return;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const contract = new this.web3.eth.Contract(TestERC721Contract, smartContract);

    let collectionImage: string | undefined;

    await Promise.all(this.addresses.map(async (address) => {
      if (!isEthereumAddress(address)) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const balance = (await contract.methods.balanceOf(address).call()) as unknown as number;

      if (Number(balance) === 0) {
        updateReady(true);

        return;
      }

      const itemIndexes: number[] = [];

      for (let i = 0; i < Number(balance); i++) {
        itemIndexes.push(i);
      }

      await Promise.all(itemIndexes.map(async (i) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const tokenId = await contract.methods.tokenOfOwnerByIndex(address, i).call() as number;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const tokenURI = await contract.methods.tokenURI(tokenId).call() as string;

        const detailUrl = this.parseUrl(tokenURI);

        if (detailUrl) {
          try {
            const itemDetail = await fetch(detailUrl)
              .then((resp) => resp.json()) as Record<string, any>;
            const parsedItem = this.parseMetadata(itemDetail);

            parsedItem.collectionId = smartContract;

            if (parsedItem) {
              if (parsedItem.image) collectionImage = parsedItem.image;
              updateItem(parsedItem);
            }
          } catch (e) {
            console.log(`error parsing item for ${this.chain as string} nft`, e);
          }
        }
      }));
    }));

    const nftCollection = {
      collectionId: smartContract,
      collectionName,
      image: collectionImage || undefined,
      chain: this.chain
    } as NftCollection;

    updateCollection(nftCollection);
    updateReady(true);
  }

  async handleNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void): Promise<void> {
    if (!this.targetContracts) return;

    await Promise.all(this.targetContracts.map(async ({ name, smartContract }) => {
      return await this.getItemsByCollection(smartContract, name, updateItem, updateCollection, updateReady);
    }));
  }

  public async fetchNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void): Promise<number> {
    try {
      this.connectWeb3();
      await this.handleNfts(updateItem, updateCollection, updateReady);
    } catch (e) {
      console.log(`error fetching nft from ${this.getChain() as string}`, e);

      return 0;
    }

    return 1;
  }
}
