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
class UniqueNftApi extends _nft.BaseNftApi {
  // eslint-disable-next-line no-useless-constructor
  constructor(api, addresses, chain) {
    super(api, addresses, chain);
  }

  async getCollectionCount() {
    if (!this.dotSamaApi) {
      return 0;
    }

    return await this.dotSamaApi.api.query.nft.createdCollectionCount();
  }
  /**
    * Retrieve address of NFTs
    *
    * @param collectionId: Id of the collection
    * @param owner: address of account
    * @returns the array of NFTs
    */


  async getAddressTokens(collectionId, owner) {
    if (!this.dotSamaApi) {
      return;
    }

    return (await this.dotSamaApi.api.query.nft.addressTokens(collectionId, owner)).toJSON();
  }
  /**
   * Retrieve NFT image URL according to the collection offchain schema
   *
   * @param collection
   * @param tokenId: Token ID
   * @returns the URL of the token image
   */


  getNftImageUrl(collection, tokenId) {
    if (!this.dotSamaApi) {
      return;
    }

    let url = ''; // Get schema version and off-chain schema

    if (!collection) {
      return;
    }

    const schemaVersion = collection.SchemaVersion;
    const offchainSchema = (0, _utils.hexToStr)(collection.OffchainSchema);

    if (schemaVersion === 'ImageURL') {
      // Replace {id} with token ID
      url = offchainSchema;
      url = url.replace('{id}', `${tokenId}`);
    } else {// TBD: Query image URL from the RESTful service
    }

    return url;
  }
  /**
   * Retrieve and deserialize properties
   *
   *
   * @param collection
   * @param tokenId: Token ID
   * @param locale: Output locale (default is "en")
   * @param collectionId
   * @returns tokenData: Token data object
   */


  async getNftData(collection, tokenId) {
    let locale = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'en';
    let collectionId = arguments.length > 3 ? arguments[3] : undefined;

    if (!this.dotSamaApi) {
      return;
    }

    const schemaRead = (0, _utils.hexToStr)(collection.ConstOnChainSchema);
    const token = (await this.dotSamaApi.api.query.nft.nftItemList(collectionId, tokenId)).toJSON();
    const nftProps = (0, _utils.hexToUTF16)(token.ConstData);
    const properties = (0, _protobuf.deserializeNft)(schemaRead, nftProps, locale);
    let url = ''; // Get schema version and off-chain schema

    if (!collection) {
      return;
    }

    const schemaVersion = collection.SchemaVersion;
    const offchainSchema = (0, _utils.hexToStr)(collection.OffchainSchema);

    if (schemaVersion === 'ImageURL') {
      // Replace {id} with token ID
      url = offchainSchema;
      url = url.replace('{id}', `${tokenId}`);
    } else {// TBD: Query image URL from the RESTful service
    }

    return {
      owner: token.Owner,
      prefix: (0, _utils.hexToStr)(collection.TokenPrefix),
      collectionName: (0, _utils.utf16ToString)(collection.Name),
      collectionDescription: (0, _utils.utf16ToString)(collection.Description),
      properties: properties,
      image: url
    };
  }

  async handleNfts(updateItem, updateCollection, updateReady) {
    // const start = performance.now();
    const collectionCount = await this.getCollectionCount();
    const addressTokenDict = [];
    let allNftId = [];
    const nftMap = {};
    const collectionMap = {};
    const allCollectionId = [];

    try {
      for (let i = 0; i < collectionCount; i++) {
        for (const address of this.addresses) {
          addressTokenDict.push({
            i,
            account: address
          });
        }
      }

      await Promise.all(addressTokenDict.map(async item => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const nftIds = await this.getAddressTokens(item.i, item.account); // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access

        if (nftIds && nftIds.length > 0) {
          allNftId = allNftId.concat(nftIds);

          if (!allCollectionId.includes(item.i)) {
            allCollectionId.push(item.i);
          }

          for (const nftId of nftIds) {
            nftMap[nftId] = item.i;
          }
        }
      }));

      if (allNftId.length <= 0) {
        updateReady(true);
        return;
      }

      await Promise.all(allCollectionId.map(async collectionId => {
        // @ts-ignore
        collectionMap[collectionId.toString()] = (await this.dotSamaApi.api.query.nft.collectionById(collectionId)).toJSON();
      }));
      await Promise.all(allNftId.map(async nft => {
        const collectionId = nftMap[nft];
        const tokenId = nft;
        const _collection = collectionMap[collectionId];
        const imageUrl = this.getNftImageUrl(_collection, tokenId);
        const tokenData = await this.getNftData(_collection, tokenId, 'en', collectionId);

        if (tokenData && imageUrl) {
          const parsedItem = {
            id: tokenId,
            name: tokenData.prefix + '#' + tokenId,
            image: (0, _utils.parseIpfsLink)(imageUrl),
            external_url: `https://unqnft.io/#/market/token-details?collectionId=${collectionId}&tokenId=${tokenId}`,
            collectionId: collectionId.toString(),
            properties: tokenData.properties,
            rarity: '',
            chain: _config.SUPPORTED_NFT_NETWORKS.uniqueNft
          };
          updateItem(parsedItem);
          const parsedCollection = {
            collectionId: collectionId.toString(),
            collectionName: tokenData.collectionName,
            image: (0, _utils.parseIpfsLink)(tokenData.image),
            chain: _config.SUPPORTED_NFT_NETWORKS.uniqueNft
          };
          updateCollection(parsedCollection);
          updateReady(true);
        }
      }));
    } catch (e) {
      console.error('Failed to fetch unique nft', e);
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

exports.default = UniqueNftApi;