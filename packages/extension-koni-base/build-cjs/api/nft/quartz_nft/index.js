"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _config = require("@polkadot/extension-koni-base/api/nft/config");

var _nft = require("@polkadot/extension-koni-base/api/nft/nft");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

var _protobuf = require("./protobuf");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
class QuartzNftApi extends _nft.BaseNftApi {
  // eslint-disable-next-line no-useless-constructor
  constructor(api, addresses, chain) {
    super(api, addresses, chain);
  }
  /**
   * Retrieve total number of ever created collections
   *
   * @returns number of created collection
   */


  async getCreatedCollectionCount() {
    if (!this.dotSamaApi) {
      return 0;
    } // @ts-ignore
    // noinspection TypeScriptValidateJSTypes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access


    return (await this.dotSamaApi.api.rpc.unique.collectionStats()).toJSON().created;
  }
  /**
    * Retrieve all NFT token IDs owned by the address (within a collection)
    *
    * @param collectionId: Id of the collection
    * @param address: address of account
    * @returns the array of NFT token IDs
    */


  async getAddressTokens(collectionId, address) {
    if (!this.dotSamaApi) {
      return;
    } // noinspection TypeScriptValidateJSTypes
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return


    return (await this.dotSamaApi.api.rpc.unique.accountTokens(collectionId, {
      Substrate: address
    })).toJSON();
  }
  /**
   * Retrieve collection properties for a given Collection ID
   *
   * @param collectionId: Id of the collection
   * @returns collection properties
   */


  async getCollectionProperties(collectionId) {
    if (!this.dotSamaApi) {
      return;
    } // @ts-ignore
    // noinspection TypeScriptValidateJSTypes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access


    return (await this.dotSamaApi.api.rpc.unique.collectionById(collectionId)).toJSON();
  }
  /**
    * Retrieve and deserialize nft details
    *
    *
    * @param collectionProperties: Id of the collection
    * @param collectionId: Collection ID
    * @param tokenId: Token ID
    * @param locale: Output locale (default is "en")
    * @returns tokenData: Token data object
    */


  async getNftData(collectionProperties, collectionId, tokenId) {
    let locale = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'en';

    if (!this.dotSamaApi) {
      return;
    } // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access


    const constMetadata = (await this.dotSamaApi.api.rpc.unique.constMetadata(collectionId, tokenId)).toHuman();
    const schemaRead = (0, _utils.hexToStr)(collectionProperties.constOnChainSchema);
    const nftProps = (0, _utils.hexToUTF16)(constMetadata);
    const properties = (0, _protobuf.deserializeNft)(schemaRead, nftProps, locale);
    let tokenImage = '';
    const schemaVersion = collectionProperties.schemaVersion;

    if (schemaVersion === 'ImageURL') {
      // Replace {id} with token ID
      tokenImage = (0, _utils.hexToStr)(collectionProperties.offchainSchema);
      tokenImage = tokenImage.replace('{id}', `${tokenId}`);
    } else {// TBD: Query from the RESTful service
    }

    let collectionImage = '';

    if (collectionProperties.variableOnChainSchema && collectionProperties.variableOnChainSchema.collectionCover) {
      collectionImage = `https://ipfs.unique.network/ipfs/${collectionProperties.variableOnChainSchema.collectionCover}`;
    } else {// TBD: Query from the RESTful service
    }

    return {
      prefix: (0, _utils.hexToStr)(collectionProperties.tokenPrefix),
      collectionName: (0, _utils.utf16ToString)(collectionProperties.name),
      collectionDescription: (0, _utils.utf16ToString)(collectionProperties.description),
      collectionImage: collectionImage,
      properties: properties,
      image: tokenImage
    };
  }

  async handleNfts(updateItem, updateCollection, updateReady) {
    const collectionCount = await this.getCreatedCollectionCount();
    const collectionPropertiesMap = {};
    const collectionIds = [];
    const addressTokenDict = [];
    let allNftId = [];
    const nftMap = {};

    try {
      for (let i = 0; i < collectionCount; i++) {
        collectionIds.push(i);
      }

      for (let i = 0; i < collectionCount; i++) {
        for (const address of this.addresses) {
          if (collectionPropertiesMap[i] !== null) {
            addressTokenDict.push({
              i,
              account: address
            });
          }
        }
      }

      const _handleCollectionPropertiesMap = Promise.all(collectionIds.map(async id => {
        collectionPropertiesMap[id] = await this.getCollectionProperties(id);
      }));

      const _handleAddressTokenDict = Promise.all(addressTokenDict.map(async item => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const nftIds = await this.getAddressTokens(item.i, item.account); // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access

          if (nftIds && nftIds.length > 0) {
            allNftId = allNftId.concat(nftIds);

            for (const nftId of nftIds) {
              nftMap[nftId] = item.i;
            }
          }
        } catch (e) {}
      }));

      await Promise.all([_handleCollectionPropertiesMap, _handleAddressTokenDict]);

      if (allNftId.length <= 0) {
        updateReady(true);
      }

      await Promise.all(allNftId.map(async tokenId => {
        const collectionId = nftMap[tokenId];
        const collectionProperties = collectionPropertiesMap[parseInt(collectionId)];
        const nftData = await this.getNftData(collectionProperties, parseInt(collectionId), parseInt(tokenId));

        if (nftData) {
          const parsedItem = {
            id: tokenId.toString(),
            name: nftData.prefix + '#' + tokenId.toString(),
            image: this.parseUrl(nftData.image),
            external_url: `https://scan-quartz.unique.network/QUARTZ/tokens/${collectionId}/${tokenId}`,
            collectionId: collectionId.toString(),
            properties: nftData.properties,
            rarity: '',
            chain: _config.SUPPORTED_NFT_NETWORKS.quartz
          };
          updateItem(parsedItem);
          const parsedCollection = {
            collectionId: collectionId.toString(),
            collectionName: nftData.collectionName,
            image: (0, _utils.parseIpfsLink)(nftData.image),
            chain: _config.SUPPORTED_NFT_NETWORKS.quartz
          };
          updateCollection(parsedCollection);
          updateReady(true);
        }
      }));
    } catch (e) {
      console.error('Failed to fetch quartz nft', e);
    }
  }

  async fetchNfts(updateItem, updateCollection, updateReady) {
    try {
      await this.connect();
      await this.handleNfts(updateItem, updateCollection, updateReady);
    } catch (e) {
      return 0;
    }

    return 1;
  }

}

exports.default = QuartzNftApi;