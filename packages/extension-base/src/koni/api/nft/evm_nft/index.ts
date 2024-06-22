// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainAsset } from '@subwallet/chain-list/types';
import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { _ERC721_ABI } from '@subwallet/extension-base/koni/api/contract-handler/utils';
import { getRandomIpfsGateway } from '@subwallet/extension-base/koni/api/nft/config';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-base/koni/api/nft/nft';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getContractAddressOfToken } from '@subwallet/extension-base/services/chain-service/utils';
import { isUrl } from '@subwallet/extension-base/utils';

import { isEthereumAddress } from '@polkadot/util-crypto';

export class EvmNftApi extends BaseNftApi {
  evmContracts: _ChainAsset[] = [];

  constructor (evmApi: _EvmApi | null, addresses: string[], chain: string) {
    super(chain, undefined, addresses);

    this.evmApi = evmApi;
    this.isEthereum = true;
  }

  setSmartContractNfts (evmContracts: _ChainAsset[]) {
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
      return getRandomIpfsGateway() + input.split('ipfs://')[1];
    }

    return getRandomIpfsGateway() + input.split('ipfs://ipfs/')[1];
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

    // if (data.compiler) {
    //   propertiesMap.compiler = {
    //     value: data.compiler as string
    //   };
    // }

    return {
      name: data.name as string | undefined,
      image: data.image_url ? this.parseUrl(data.image_url as string) : this.parseUrl(data.image as string),
      description: data.description as string | undefined,
      properties: propertiesMap,
      externalUrl: data.external_url as string | undefined,
      chain: this.chain
    } as NftItem;
  }

  private async getItemsByCollection (tokenInfo: _ChainAsset, collectionName: string | undefined, nftParams: HandleNftParams) {
    if (!this.evmApi) {
      return;
    }

    const smartContract = _getContractAddressOfToken(tokenInfo);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    const contract = new this.evmApi.api.eth.Contract(_ERC721_ABI, smartContract);
    let ownItem = false;

    let collectionImage: string | undefined;
    const nftOwnerMap: Record<string, string[]> = {};

    await Promise.all(this.addresses.map(async (address) => {
      if (!isEthereumAddress(address)) {
        return;
      }

      const nftIds: string[] = [];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const balance = (await contract.methods.balanceOf(address).call()) as unknown as number;

      if (Number(balance) === 0) {
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

          const nftId = tokenId.toString();

          nftIds.push(nftId);

          if (detailUrl) {
            try {
              const resp = await fetch(detailUrl);
              const itemDetail = (resp && resp.ok && await resp.json() as Record<string, any>);

              if (!itemDetail) {
                return;
              }

              const parsedItem = this.parseMetadata(itemDetail);

              parsedItem.collectionId = smartContract;
              parsedItem.id = nftId;
              parsedItem.owner = address;
              parsedItem.type = _AssetType.ERC721;
              parsedItem.originAsset = tokenInfo.slug;

              if (parsedItem) {
                if (parsedItem.image) {
                  collectionImage = parsedItem.image;
                }

                nftParams.updateItem(this.chain, parsedItem, address);
                ownItem = true;
              }
            } catch (e) {
              console.error(`${this.chain}`, e);
            }
          }
        }));

        nftOwnerMap[address] = nftIds;
      } catch (e) {
        console.error(`${this.chain}`, e);
      }
    }));

    if (ownItem) {
      const nftCollection = {
        collectionId: smartContract,
        collectionName,
        image: collectionImage || undefined,
        chain: this.chain,
        originAsset: tokenInfo.slug
      } as NftCollection;

      nftParams.updateCollection(this.chain, nftCollection);
    }
  }

  async handleNfts (params: HandleNftParams): Promise<void> {
    if (!this.evmContracts || this.evmContracts.length === 0) {
      return;
    }

    await Promise.all(this.evmContracts.map(async (tokenInfo) => {
      return await this.getItemsByCollection(tokenInfo, tokenInfo.name, params);
    }));
  }

  public async fetchNfts (params: HandleNftParams): Promise<number> {
    try {
      await this.handleNfts(params);
    } catch (e) {
      return 0;
    }

    return 1;
  }
}
