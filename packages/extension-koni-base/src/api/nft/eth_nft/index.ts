// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'cross-fetch';
import Web3 from 'web3';

import { CustomEvmToken, NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import NETWORKS, { EVM_NETWORKS } from '@polkadot/extension-koni-base/api/endpoints';
import { CF_IPFS_GATEWAY, SUPPORTED_NFT_NETWORKS } from '@polkadot/extension-koni-base/api/nft/config';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';
import { ERC721Contract } from '@polkadot/extension-koni-base/api/web3/web3';
import { isUrl } from '@polkadot/extension-koni-base/utils/utils';
import { isEthereumAddress } from '@polkadot/util-crypto';

export class Web3NftApi extends BaseNftApi {
  web3: Web3 | null = null;
  evmContracts: CustomEvmToken[] = [];
  isConnected = false;

  constructor (addresses: string[], chain: string) {
    super(undefined, addresses, chain);
  }

  connectWeb3 () {
    if (this.chain === SUPPORTED_NFT_NETWORKS.astarEvm) {
      this.web3 = new Web3(new Web3.providers.WebsocketProvider(NETWORKS.astar.provider));
    } else {
      this.web3 = new Web3(new Web3.providers.WebsocketProvider(EVM_NETWORKS[this.chain as string].provider));
    }
  }

  setEvmContracts (evmContracts: CustomEvmToken[]) {
    this.evmContracts = evmContracts;
  }

  override parseUrl (input: string): string | undefined {
    if (!input) {
      return undefined;
    }

    if (isUrl(input)) {
      return input;
    }

    if (input.includes('ipfs://')) {
      return CF_IPFS_GATEWAY + input.split('ipfs://')[1];
    }

    return CF_IPFS_GATEWAY + input.split('ipfs://ipfs/')[1];
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
      name: data.name as string | undefined,
      image: data.image_url ? this.parseUrl(data.image_url as string) : this.parseUrl(data.image as string),
      description: data.description as string | undefined,
      properties: propertiesMap,
      external_url: data.external_url as string | undefined,
      chain: this.chain
    } as NftItem;
  }

  private async getItemsByCollection (smartContract: string, collectionName: string | undefined, updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void) {
    if (!this.web3) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const contract = new this.web3.eth.Contract(ERC721Contract, smartContract);
    let ownItem = false;

    let collectionImage: string | undefined;

    await Promise.all(this.addresses.map(async (address) => {
      if (!isEthereumAddress(address)) {
        return;
      }

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

      try {
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
              parsedItem.id = tokenId.toString();

              if (parsedItem) {
                if (parsedItem.image) {
                  collectionImage = parsedItem.image;
                }

                updateItem(parsedItem);
                ownItem = true;
              }
            } catch (e) {
              console.error(`error parsing item for ${this.chain as string} nft`, e);
            }
          }
        }));
      } catch (e) {
        console.error('evm nft error', e);
      }
    }));

    if (ownItem) {
      const nftCollection = {
        collectionId: smartContract,
        collectionName,
        image: collectionImage || undefined,
        chain: this.chain
      } as NftCollection;

      updateCollection(nftCollection);
      updateReady(true);
    }
  }

  async handleNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void): Promise<void> {
    if (!this.evmContracts) {
      return;
    }

    await Promise.all(this.evmContracts.map(async ({ name, smartContract }) => {
      return await this.getItemsByCollection(smartContract, name, updateItem, updateCollection, updateReady);
    }));
  }

  public async fetchNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void): Promise<number> {
    try {
      this.connectWeb3();
      await this.handleNfts(updateItem, updateCollection, updateReady);
    } catch (e) {
      return 0;
    }

    return 1;
  }
}
