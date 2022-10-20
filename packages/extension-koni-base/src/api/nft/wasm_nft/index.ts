// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, CustomToken, CustomTokenType, NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-koni-base/api/nft/nft';
import { ART_ZERO_COLLECTION_API, ART_ZERO_CONTRACTS, ART_ZERO_IMAGE_API, ART_ZERO_IPFS_API } from '@subwallet/extension-koni-base/api/nft/wasm_nft/utils';
import { PSP34Contract } from '@subwallet/extension-koni-base/api/tokens/wasm/helper';
import fetch from 'cross-fetch';

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { isEthereumAddress } from '@polkadot/util-crypto';

interface CollectionAttributes {
  storedOnChain: boolean,
  attributeList: string[] // list of attribute names
}

export class WasmNftApi extends BaseNftApi {
  private wasmContracts: CustomToken[] = [];

  constructor (api: ApiProps | null, addresses: string[], chain: string) {
    super(chain, api, addresses);
  }

  setWasmContracts (wasmContracts: CustomToken[]) {
    this.wasmContracts = wasmContracts;
  }

  private parseFeaturedTokenUri (tokenUri: string) {
    if (!tokenUri || tokenUri.length === 0) {
      return undefined;
    }

    if (!tokenUri.includes('ipfs://') && !tokenUri.includes('ipfs://ipfs/')) {
      return `ipfs://${tokenUri}`;
    }

    if (tokenUri.includes('ipfs://ipfs/')) {
      return `ipfs://${tokenUri}`;
    }

    return tokenUri;
  }

  private parseFeaturedNftImage (tokenUri: string) {
    const parsedTokenUri = this.parseFeaturedTokenUri(tokenUri);

    if (!parsedTokenUri) {
      return undefined;
    }

    return `${ART_ZERO_IMAGE_API}?input=${parsedTokenUri}&size=500`;
  }

  private async parseFeaturedCollectionImage (smartContract: string) {
    const resp = await fetch(ART_ZERO_COLLECTION_API, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ collection_address: smartContract })
    });

    const result = (resp && resp.ok && await resp.json() as Record<string, any>);

    if (!result) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const collectionDetail = result.ret[0] as Record<string, any>;
    const collectionImage = collectionDetail.avatarImage as string;
    const parsedCollectionImage = this.parseFeaturedTokenUri(collectionImage);

    if (!parsedCollectionImage) {
      return;
    }

    return `${ART_ZERO_IMAGE_API}?input=${parsedCollectionImage}`;
  }

  private async getCollectionAttributes (contractPromise: ContractPromise): Promise<CollectionAttributes> {
    const _onChainAttributeCount = await contractPromise.query['psp34Traits::getAttributeCount'](this.addresses[0], { gasLimit: -1 });
    const onChainAttributeCount = _onChainAttributeCount.output ? _onChainAttributeCount.output.toString() : '0';

    if (parseInt(onChainAttributeCount) === 0) {
      return {
        storedOnChain: false,
        attributeList: []
      };
    }

    const attributeList: string[] = [];
    const attributeIndexes: number[] = [];

    for (let i = 0; i < parseInt(onChainAttributeCount); i++) {
      attributeIndexes.push(i);
    }

    await Promise.all(attributeIndexes.map(async (i) => {
      const _attributeByIndex = await contractPromise.query['psp34Traits::getAttributeName'](this.addresses[0], { gasLimit: -1 }, i);

      if (_attributeByIndex.output) {
        const attributeName = _attributeByIndex.output.toString();

        if (attributeName !== '') {
          attributeList.push(attributeName);
        }
      }
    }));

    return {
      storedOnChain: true,
      attributeList
    };
  }

  private async processOnChainMetadata (contractPromise: ContractPromise, address: string, tokenIdObj: Record<string, string>, collectionAttributes: string[], isFeatured: boolean): Promise<NftItem> {
    const nftItem: NftItem = {};
    const _attributeValues = await contractPromise.query['psp34Traits::getAttributes'](address, { gasLimit: -1 }, tokenIdObj, collectionAttributes);

    if (_attributeValues.output) {
      const attributeValues = _attributeValues.output.toHuman() as string[];

      const attributeDict: Record<string, any> = {};

      for (let i = 0; i < collectionAttributes.length; i++) {
        const attributeName = collectionAttributes[i];
        const attributeValue = attributeValues[i] ? attributeValues[i] : '';

        if (attributeName.toLowerCase() === 'nft_name') {
          nftItem.name = attributeValue;
        } else if (attributeName.toLowerCase() === 'description') {
          nftItem.description = attributeValue;
        } else if (attributeName.toLowerCase() === 'avatar') {
          if (isFeatured) {
            nftItem.image = this.parseFeaturedNftImage(attributeValue);
          } else {
            nftItem.image = this.parseUrl(attributeValue);
          }
        } else {
          if (attributeValue !== '') {
            attributeDict[attributeName] = { value: attributeValue };
          }
        }
      }

      nftItem.properties = attributeDict;
    }

    return nftItem;
  }

  private async processOffChainMetadata (contractPromise: ContractPromise, address: string, tokenId: string, isFeatured: boolean): Promise<NftItem> {
    const nftItem: NftItem = { name: tokenId };

    const _tokenUri = await contractPromise.query['psp34Traits::tokenUri'](address, { gasLimit: -1 }, tokenId);

    if (_tokenUri.output) {
      let itemDetail: Record<string, any> | boolean = false;
      const tokenUri = _tokenUri.output.toString();

      if (isFeatured) {
        const parsedTokenUri = this.parseFeaturedTokenUri(tokenUri);

        if (parsedTokenUri) {
          const resp = await fetch(`${ART_ZERO_IPFS_API}?input=${parsedTokenUri}`);

          itemDetail = (resp && resp.ok && await resp.json() as Record<string, any>);
        }
      } else {
        const detailUrl = this.parseUrl(tokenUri);

        if (detailUrl) {
          const resp = await fetch(detailUrl);

          itemDetail = (resp && resp.ok && await resp.json() as Record<string, any>);
        }
      }

      if (!itemDetail) {
        console.warn(`Cannot fetch NFT metadata [${tokenId}] from PSP-34 contract.`);

        return nftItem;
      }

      nftItem.name = itemDetail.name as string | undefined;
      nftItem.description = itemDetail.description as string | undefined;
      nftItem.external_url = itemDetail.external_url as string | undefined;

      const rawImageSrc = itemDetail.image ? itemDetail.image as string : itemDetail.image_url as string;

      if (isFeatured) {
        nftItem.image = this.parseFeaturedNftImage(rawImageSrc);
      } else {
        nftItem.image = this.parseUrl(rawImageSrc);
      }

      const propertiesMap: Record<string, any> = {};
      const traitList = itemDetail.attributes ? itemDetail.attributes as Record<string, any>[] : itemDetail.traits as Record<string, any>[];

      if (traitList) {
        traitList.forEach((traitMap) => {
          propertiesMap[traitMap.trait_type as string] = {
            value: traitMap.value as string
          };
        });

        nftItem.properties = propertiesMap;
      }
    }

    return nftItem;
  }

  private async getItemsByCollection (contractPromise: ContractPromise, collectionAttributes: string[], isMetadataOnchain: boolean, smartContract: string, collectionName: string | undefined, nftParams: HandleNftParams) {
    let ownItem = false;

    let collectionImage: string | undefined;

    const isFeatured = ART_ZERO_CONTRACTS.includes(smartContract);

    await Promise.all(this.addresses.map(async (address) => {
      if (isEthereumAddress(address)) {
        return;
      }

      const nftIds: string[] = [];

      const _balance = await contractPromise.query['psp34::balanceOf'](address, { gasLimit: -1 }, address);

      const balance = _balance.output ? _balance.output.toString() : '0';

      if (parseInt(balance) === 0) {
        nftParams.updateNftIds(this.chain, address, smartContract, nftIds);

        return;
      }

      const itemIndexes: number[] = [];

      for (let i = 0; i < parseInt(balance); i++) {
        itemIndexes.push(i);
      }

      try {
        await Promise.all(itemIndexes.map(async (i) => {
          const _tokenByIndexResp = await contractPromise.query['psp34Enumerable::ownersTokenByIndex'](address, { gasLimit: -1 }, address, i);

          if (_tokenByIndexResp.output) {
            const rawTokenId = _tokenByIndexResp.output.toHuman() as Record<string, any>;
            const tokenIdObj = rawTokenId.Ok as Record<string, string>;
            const tokenId = Object.values(tokenIdObj)[0];

            nftIds.push(tokenId);

            let nftItem: NftItem;

            if (isMetadataOnchain) {
              nftItem = await this.processOnChainMetadata(contractPromise, address, tokenIdObj, collectionAttributes, isFeatured);
            } else {
              nftItem = await this.processOffChainMetadata(contractPromise, address, tokenId, isFeatured);
            }

            nftItem.collectionId = smartContract;
            nftItem.chain = this.chain;
            nftItem.type = CustomTokenType.psp34;
            nftItem.id = tokenId;
            nftItem.owner = address;

            nftParams.updateItem(this.chain, nftItem, address);
            ownItem = true;

            if (!isFeatured && !collectionImage && nftItem.image) {
              collectionImage = nftItem.image; // No default collection image
            }
          }
        }));
      } catch (e) {
        console.error(`error parsing item for ${this.chain} nft`, e);
      }

      nftParams.updateNftIds(this.chain, address, smartContract, nftIds);
    }));

    if (isFeatured) {
      const featuredCollectionImage = await this.parseFeaturedCollectionImage(smartContract);

      if (featuredCollectionImage) {
        collectionImage = featuredCollectionImage;
      }
    }

    if (ownItem) {
      const nftCollection = {
        collectionId: smartContract,
        collectionName,
        image: collectionImage || undefined,
        chain: this.chain
      } as NftCollection;

      nftParams.updateCollection(this.chain, nftCollection);
    }
  }

  public async fetchNfts (params: HandleNftParams): Promise<number> {
    try {
      await this.handleNfts(params);
    } catch (e) {
      return 0;
    }

    return 1;
  }

  async handleNfts (params: HandleNftParams): Promise<void> {
    if (!this.wasmContracts || this.wasmContracts.length === 0) {
      return;
    }

    await this.connect(); // might not be necessary

    const apiPromise = this.dotSamaApi?.api as ApiPromise;

    await Promise.all(this.wasmContracts.map(async ({ name, smartContract }) => {
      const contractPromise = new ContractPromise(apiPromise, PSP34Contract, smartContract);

      const { attributeList, storedOnChain } = await this.getCollectionAttributes(contractPromise);

      return await this.getItemsByCollection(contractPromise, attributeList, storedOnChain, smartContract, name, params);
    }));
  }
}
