// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainAsset } from '@subwallet/chain-list/types';
import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { getPSP34ContractPromise, getTokenUriMethod, isAzeroDomainNft, isPinkRoboNft } from '@subwallet/extension-base/koni/api/contract-handler/wasm';
import { getDefaultWeightV2 } from '@subwallet/extension-base/koni/api/contract-handler/wasm/utils';
import { AZERO_DOMAIN_CONTRACTS } from '@subwallet/extension-base/koni/api/dotsama/domain';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-base/koni/api/nft/nft';
import { collectionApiFromArtZero, collectionDetailApiFromArtZero, externalUrlOnArtZero, ipfsApiFromArtZero, itemImageApiFromArtZero } from '@subwallet/extension-base/koni/api/nft/wasm_nft/utils';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getContractAddressOfToken } from '@subwallet/extension-base/services/chain-service/utils';
import { isUrl } from '@subwallet/extension-base/utils';

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { isEthereumAddress } from '@polkadot/util-crypto';

// interface CollectionAttributes {
//   storedOnChain: boolean,
//   attributeList: string[] // list of attribute names
// }

async function isArtZeroFeaturedCollection (networkKey: string, contractAddress: string) {
  const timeout = new Promise((resolve) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      resolve(null);
    }, 3000);
  });

  const urlencoded = new URLSearchParams();

  urlencoded.append('collection_address', contractAddress);

  const collectionInfoPromise = new Promise(function (resolve) {
    fetch(collectionApiFromArtZero(networkKey), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: urlencoded
    }).then((resp) => {
      resolve(resp.json());
    }).catch(console.error);
  });

  const collectionInfo = await Promise.race([
    timeout,
    collectionInfoPromise
  ]);

  // @ts-ignore
  return collectionInfo !== null && collectionInfo?.status !== 'FAILED';
}

export class WasmNftApi extends BaseNftApi {
  private wasmContracts: _ChainAsset[] = [];

  constructor (api: _SubstrateApi | null, addresses: string[], chain: string) {
    super(chain, api, addresses);
  }

  setSmartContractNfts (wasmContracts: _ChainAsset[]) {
    this.wasmContracts = wasmContracts;
  }

  private async isAttributeStoredOnChain (contractPromise: ContractPromise): Promise<boolean> {
    if (!contractPromise.query['psp34Traits::getAttributeCount']) {
      return false;
    }

    // @ts-ignore
    const _onChainAttributeCount = await contractPromise.query['psp34Traits::getAttributeCount'](this.addresses[0], { gasLimit: getDefaultWeightV2(this.substrateApi?.api as ApiPromise) });
    const _attributeCount = _onChainAttributeCount?.output?.toJSON() as Record<string, unknown>;
    const onChainAttributeCount = _onChainAttributeCount.output ? (_attributeCount?.ok || _attributeCount?.Ok) as string : '0';

    if (!_onChainAttributeCount.result.isOk) {
      return false;
    }

    return !!onChainAttributeCount && parseInt(onChainAttributeCount) !== 0;
  }

  private parseFeaturedTokenUri (tokenUri: string) {
    if (!tokenUri || tokenUri.length === 0) {
      return undefined;
    }

    if (isUrl(tokenUri)) {
      return tokenUri;
    }

    if (tokenUri.startsWith('/ipfs/')) {
      return tokenUri;
    }

    if (tokenUri.startsWith('ipfs://')) {
      return `/ipfs/${tokenUri.split('ipfs://')[1]}`;
    }

    if (!tokenUri.includes('ipfs://') && !tokenUri.includes('ipfs://ipfs/')) {
      return `/ipfs/${tokenUri}`;
    }

    if (tokenUri.includes('ipfs://ipfs/')) {
      return `/ipfs/${tokenUri.split('ipfs://ipfs/')[1]}`;
    }

    return tokenUri;
  }

  private async parseFeaturedNftImage (tokenUri: string) {
    const parsedTokenUri = this.parseFeaturedTokenUri(tokenUri);

    if (!parsedTokenUri) {
      return undefined;
    }

    const nftItemImageSrc = `${itemImageApiFromArtZero(this.chain)}?input=${parsedTokenUri}&size=500`;

    const collectionImageUrl = await fetch(nftItemImageSrc);

    return await collectionImageUrl.text();
  }

  private async parseFeaturedCollectionImage (smartContract: string) {
    const urlencoded = new URLSearchParams();

    urlencoded.append('collection_address', smartContract);
    const resp = await fetch(collectionDetailApiFromArtZero(this.chain), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: urlencoded
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

    const collectionImageSrc = `${itemImageApiFromArtZero(this.chain)}?input=${parsedCollectionImage}&size=500`;

    const collectionImageUrl = await fetch(collectionImageSrc);

    return await collectionImageUrl.text();
  }

  // private async getCollectionAttributes (contractPromise: ContractPromise): Promise<CollectionAttributes> {
  //   const _onChainAttributeCount = await contractPromise.query['psp34Traits::getAttributeCount'](this.addresses[0], { gasLimit: getDefaultWeightV2(this.substrateApi?.api as ApiPromise) });
  //   const onChainAttributeCount = _onChainAttributeCount.output ? _onChainAttributeCount.output.toString() : '0';
  //
  //   if (parseInt(onChainAttributeCount) === 0) {
  //     return {
  //       storedOnChain: false,
  //       attributeList: []
  //     };
  //   }
  //
  //   const attributeList: string[] = [];
  //   const attributeIndexes: number[] = [];
  //
  //   for (let i = 0; i < parseInt(onChainAttributeCount); i++) {
  //     attributeIndexes.push(i);
  //   }
  //
  //   await Promise.all(attributeIndexes.map(async (i) => {
  //     const _attributeByIndex = await contractPromise.query['psp34Traits::getAttributeName'](this.addresses[0], { gasLimit: getDefaultWeightV2(this.substrateApi?.api as ApiPromise) }, i);
  //
  //     if (_attributeByIndex.output) {
  //       const attributeName = _attributeByIndex.output.toString();
  //
  //       if (attributeName !== '') {
  //         attributeList.push(attributeName);
  //       }
  //     }
  //   }));
  //
  //   return {
  //     storedOnChain: true,
  //     attributeList
  //   };
  // }

  // private async processOnChainMetadata (contractPromise: ContractPromise, address: string, tokenIdObj: Record<string, string>, collectionAttributes: string[], isFeatured: boolean): Promise<NftItem> {
  //   const nftItem: NftItem = { chain: '', collectionId: '', id: '', owner: '' };
  //   const _attributeValues = await contractPromise.query['psp34Traits::getAttributes'](address, { gasLimit: getDefaultWeightV2(this.substrateApi?.api as ApiPromise) }, tokenIdObj, collectionAttributes);
  //
  //   if (_attributeValues.output) {
  //     const attributeValues = _attributeValues.output.toHuman() as string[];
  //
  //     const attributeDict: Record<string, any> = {};
  //
  //     for (let i = 0; i < collectionAttributes.length; i++) {
  //       const attributeName = collectionAttributes[i];
  //       const attributeValue = attributeValues[i] ? attributeValues[i] : '';
  //
  //       if (attributeName.toLowerCase() === 'nft_name') {
  //         nftItem.name = attributeValue;
  //       } else if (attributeName.toLowerCase() === 'description') {
  //         nftItem.description = attributeValue;
  //       } else if (attributeName.toLowerCase() === 'avatar') {
  //         if (isFeatured) {
  //           nftItem.image = await this.parseFeaturedNftImage(attributeValue);
  //         } else {
  //           nftItem.image = this.parseUrl(attributeValue);
  //         }
  //       } else {
  //         if (attributeValue !== '') {
  //           attributeDict[attributeName] = { value: attributeValue };
  //         }
  //       }
  //     }
  //
  //     nftItem.properties = attributeDict;
  //   }
  //
  //   if (isFeatured) {
  //     nftItem.externalUrl = ART_ZERO_EXTERNAL_URL;
  //   }
  //
  //   return nftItem;
  // }

  private async processOnChainMetadata (tokenId: string, isFeatured: boolean, tokenUri: string): Promise<NftItem> {
    const nftItem: NftItem = { chain: '', collectionId: '', id: '', owner: '', name: tokenId };

    let itemDetail: Record<string, any> | boolean = false;

    if (isFeatured) {
      const parsedTokenUri = this.parseFeaturedTokenUri(tokenUri);

      if (parsedTokenUri) {
        const resp = await fetch(`${ipfsApiFromArtZero(this.chain)}?input=${parsedTokenUri}`);

        itemDetail = (resp && resp.ok && await resp.json() as Record<string, any>);
      }
    } else {
      const parsedTokenUri = this.parseFeaturedTokenUri(tokenUri);
      const detailUrl = this.parseUrl(parsedTokenUri as string);

      if (detailUrl) {
        const resp = await fetch(detailUrl);

        itemDetail = (resp && resp.ok && await resp.json() as Record<string, any>);
      }
    }

    if (!itemDetail) {
      return nftItem;
    }

    nftItem.name = itemDetail.name as string | undefined;
    nftItem.description = itemDetail.description as string | undefined;

    const rawImageSrc = itemDetail.image ? itemDetail.image as string : itemDetail.image_url as string;

    if (isFeatured) {
      nftItem.image = await this.parseFeaturedNftImage(rawImageSrc);
      nftItem.externalUrl = externalUrlOnArtZero(this.chain);
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

    return nftItem;
  }

  private async processOffChainMetadata (contractPromise: ContractPromise, address: string, tokenId: string, isFeatured: boolean): Promise<NftItem> {
    const nftItem: NftItem = { chain: '', collectionId: '', id: '', owner: '', name: tokenId };
    const _isFeatured = isFeatured && !AZERO_DOMAIN_CONTRACTS.includes(contractPromise.address.toString());

    const _tokenUri = await contractPromise.query[getTokenUriMethod(contractPromise.address.toString())](
      address,
      { gasLimit: getDefaultWeightV2(this.substrateApi?.api as ApiPromise) },
      isAzeroDomainNft(contractPromise.address.toString()) ? { bytes: tokenId } : tokenId);

    if (_tokenUri.output) {
      let itemDetail: Record<string, any> | boolean = false;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const _tokenUriObj = _tokenUri.output.toJSON() as Record<string, any>;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const tokenUri = isPinkRoboNft(contractPromise.address.toString()) ? _tokenUriObj.ok.ok as string : (_tokenUriObj.Ok || _tokenUriObj.ok) as string;

      if (_isFeatured) {
        const parsedTokenUri = this.parseFeaturedTokenUri(tokenUri);

        if (parsedTokenUri) {
          const resp = await fetch(`${ipfsApiFromArtZero(this.chain)}?input=${parsedTokenUri}`);

          itemDetail = (resp && resp.ok && await resp.json()) as Record<string, any>;
        }
      } else {
        const parsedTokenUri = this.parseFeaturedTokenUri(tokenUri);
        const detailUrl = this.parseUrl(parsedTokenUri as string);

        if (detailUrl) {
          const resp = await fetch(detailUrl);

          itemDetail = (resp && resp.ok && await resp.json() as Record<string, any>);

          if (AZERO_DOMAIN_CONTRACTS.includes(contractPromise.address.toString())) {
            // @ts-ignore
            itemDetail = itemDetail?.metadata as Record<string, any>;
          }
        }
      }

      if (!itemDetail) {
        return nftItem;
      }

      nftItem.name = itemDetail.name as string | undefined;
      nftItem.description = itemDetail.description as string | undefined;
      nftItem.externalUrl = itemDetail.external_url as string | undefined;

      const rawImageSrc = itemDetail.image ? itemDetail.image as string : itemDetail.image_url as string;

      if (_isFeatured) {
        nftItem.image = await this.parseFeaturedNftImage(rawImageSrc);
        nftItem.externalUrl = externalUrlOnArtZero(this.chain);
      } else {
        nftItem.image = this.parseUrl(rawImageSrc);
      }

      const propertiesMap: Record<string, any> = {};
      const traitList = (itemDetail.attributes || itemDetail.traits) as Record<string, any>[];

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

  private async getItemsByCollection (contractPromise: ContractPromise, tokenInfo: _ChainAsset, collectionName: string | undefined, nftParams: HandleNftParams, isFeatured: boolean, isAttributeOnChain: boolean) {
    let ownItem = false;
    let collectionImage: string | undefined;
    const smartContract = _getContractAddressOfToken(tokenInfo);

    const nftOwnerMap: Record<string, string[]> = {};

    await Promise.all(this.addresses.map(async (address) => {
      if (isEthereumAddress(address)) {
        return;
      }

      const nftIds: string[] = [];

      const _balance = await contractPromise.query['psp34::balanceOf'](address, { gasLimit: getDefaultWeightV2(this.substrateApi?.api as ApiPromise) }, address);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const balanceJson = _balance?.output?.toJSON() as Record<string, any>;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const balance = _balance.output ? ((balanceJson.ok || balanceJson.Ok) as string) : '0';

      if (parseInt(balance) === 0) {
        return;
      }

      const itemIndexes: number[] = [];

      for (let i = 0; i < parseInt(balance); i++) {
        itemIndexes.push(i);
      }

      try {
        await Promise.all(itemIndexes.map(async (i) => {
          const _tokenByIndexResp = await contractPromise.query['psp34Enumerable::ownersTokenByIndex'](address, { gasLimit: getDefaultWeightV2(this.substrateApi?.api as ApiPromise) }, address, i);

          if (_tokenByIndexResp.output) {
            const rawTokenId = _tokenByIndexResp.output.toHuman() as Record<string, any>;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            let tokenIdObj = (rawTokenId.Ok.Ok || rawTokenId.ok.ok) as Record<string, string>; // capital O, not normal o
            const tokenId = Object.values(tokenIdObj)[0].replaceAll(',', '');

            if (isAzeroDomainNft(contractPromise.address.toString())) {
              tokenIdObj = { bytes: tokenId };
            }

            nftIds.push(tokenId);

            let tokenUri: string | undefined;

            try {
              if (isAttributeOnChain) {
                const _tokenUri = await contractPromise.query['psp34Traits::getAttributes'](
                  address,
                  { gasLimit: getDefaultWeightV2(this.substrateApi?.api as ApiPromise) },
                  tokenIdObj,
                  ['metadata']
                );
                const tokenUriObj = _tokenUri.output?.toJSON() as Record<string, unknown>;

                tokenUri = ((tokenUriObj.ok || tokenUriObj.Ok) as string[])[0];
              }
            } catch (e) {
              console.debug(e);
            }

            if (!tokenUri) {
              const nftItem = await this.processOffChainMetadata(contractPromise, address, tokenId, isFeatured);

              nftItem.collectionId = smartContract;
              nftItem.chain = this.chain;
              nftItem.type = _AssetType.PSP34;
              nftItem.id = tokenId;
              nftItem.owner = address;
              nftItem.onChainOption = tokenIdObj;
              nftItem.originAsset = tokenInfo.slug;

              nftParams.updateItem(this.chain, nftItem, address);
              ownItem = true;

              if (!isFeatured && !collectionImage && nftItem.image) {
                collectionImage = nftItem.image; // No default collection image
              }
            } else {
              const nftItem = await this.processOnChainMetadata(tokenId, false, tokenUri);

              nftItem.collectionId = smartContract;
              nftItem.chain = this.chain;
              nftItem.type = _AssetType.PSP34;
              nftItem.id = tokenId;
              nftItem.owner = address;
              nftItem.onChainOption = tokenIdObj;
              nftItem.originAsset = tokenInfo.slug;

              nftParams.updateItem(this.chain, nftItem, address);
              ownItem = true;

              if (!isFeatured && !collectionImage && nftItem.image) {
                collectionImage = nftItem.image; // No default collection image
              }
            }
          }
        }));

        nftOwnerMap[address] = nftIds;
      } catch (e) {
        console.error(`${this.chain}`, e);
      }
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
        chain: this.chain,
        originAsset: tokenInfo.slug
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

    const apiPromise = this.substrateApi?.api as ApiPromise;

    await Promise.all(this.wasmContracts.map(async (tokenInfo) => {
      const contractPromise = getPSP34ContractPromise(apiPromise, _getContractAddressOfToken(tokenInfo));

      const [isAttributeOnChain, isCollectionFeatured] = await Promise.all([
        this.isAttributeStoredOnChain(contractPromise),
        isArtZeroFeaturedCollection(this.chain, _getContractAddressOfToken(tokenInfo))
      ]);

      return await this.getItemsByCollection(contractPromise, tokenInfo, tokenInfo.name, params, isCollectionFeatured, isAttributeOnChain);
    }));
  }
}
