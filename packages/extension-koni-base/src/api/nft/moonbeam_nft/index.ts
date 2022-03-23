// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'cross-fetch';

import { NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { MOONBEAM_CHAIN_NAME, PINATA_SERVER } from '@polkadot/extension-koni-base/api/nft/config';
import { SUPPORTED_NFT_CONTRACTS } from '@polkadot/extension-koni-base/api/nft/moonbeam_nft/utils';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';
import { getERC721Contract } from '@polkadot/extension-koni-base/api/web3/web3';
import { convertToEvmAddress, isUrl } from '@polkadot/extension-koni-base/utils/utils';

export class MoonbeamNftApi extends BaseNftApi {
  // TODO: refresh connection
  // TODO: parse metadata generically
  // TODO: check data on each collection
  // TODO: check function call exist on each collection
  constructor (addresses: string[], chain: string) {
    const evmAddresses = [];

    for (const address of addresses) {
      const evmAddress = convertToEvmAddress(address);

      evmAddresses.push(evmAddress);
    }

    super(undefined, addresses, chain);
  }

  override setAddresses (addresses: string[]) {
    super.setAddresses(addresses);
    const evmAddresses = [];

    for (const address of this.addresses) {
      const evmAddress = convertToEvmAddress(address);

      evmAddresses.push(evmAddress);
    }

    this.addresses = evmAddresses;
  }

  override parseUrl (input: string): string | undefined {
    if (isUrl(input)) return input;

    if (input.includes('ipfs://')) {
      return PINATA_SERVER + input.split('ipfs://')[1];
    }

    return PINATA_SERVER + input.split('ipfs://ipfs/')[1];
  }

  private parseMetadata (data: Record<string, any>, itemTotal: number): NftItem {
    const traitList = data.traits as Record<string, any>[];
    const propertiesMap: Record<string, any> = {};

    if (traitList) {
      traitList.forEach((traitMap) => {
        propertiesMap[traitMap.trait_type as string] = {
          value: traitMap.value as string,
          rarity: traitMap.trait_count / itemTotal
        };
      });
    }

    return {
      id: data.token_id as string,
      name: data.name as string | undefined,
      image: this.parseUrl(data.image_url as string),
      description: data.description as string | undefined,
      properties: propertiesMap,
      external_url: data.external_url as string | undefined,
      chain: MOONBEAM_CHAIN_NAME
    } as NftItem;
  }

  private async getItemsByCollection (smartContract: string, collectionName: string) {
    const contract = getERC721Contract('moonbeam', smartContract);
    const allItems: NftItem[] = [];
    let total = 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const totalSupply = await contract.methods.totalSupply().call() as number;
    let collectionImage: string | undefined;

    await Promise.all(this.addresses.map(async (address) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const balance = (await contract.methods.balanceOf(address).call()) as unknown as number;

      total += balance;
      console.log(total);
      const itemIndexes: number[] = [];

      for (let i = 0; i < balance; i++) {
        itemIndexes.push(i);
      }

      await Promise.all(itemIndexes.map(async (i) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const tokenId = await contract.methods.tokenOfOwnerByIndex(address, i).call() as number;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const tokenURI = await contract.methods.tokenURI(tokenId).call() as string;

        const detailUrl = this.parseUrl(tokenURI);

        if (detailUrl) {
          const itemDetail = await fetch(detailUrl)
            .then((resp) => resp.json()) as Record<string, any>;

          const parsedItem = this.parseMetadata(itemDetail, totalSupply);

          if (parsedItem.image) collectionImage = parsedItem.image;
          allItems.push(parsedItem);
        }
      }));
    }));

    const nftCollection = {
      collectionId: smartContract,
      collectionName,
      image: collectionImage || undefined,
      nftItems: allItems,
      chain: MOONBEAM_CHAIN_NAME
    } as NftCollection;

    return {
      totalItems: total,
      nftCollection
    };
  }

  async handleNfts (): Promise<void> {
    const allData = await Promise.all(SUPPORTED_NFT_CONTRACTS.map(async ({ name, smartContract }) => {
      return await this.getItemsByCollection(smartContract, name);
    }));
    const nftCollections: NftCollection[] = [];
    let total = 0;

    allData.forEach((collection) => {
      nftCollections.push(collection.nftCollection);
      total += collection.totalItems;
    });

    this.data = nftCollections;
    this.total = total;
  }

  public async fetchNfts (): Promise<number> {
    try {
      await this.handleNfts();
    } catch (e) {
      console.log(`error fetching nft from ${this.getChain() as string}`, e);

      return 0;
    }

    return 1;
  }
}
