"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _crossFetch = _interopRequireDefault(require("cross-fetch"));

var _config = require("@polkadot/extension-koni-base/api/nft/config");

var _nft = require("@polkadot/extension-koni-base/api/nft/nft");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
class StatemineNftApi extends _nft.BaseNftApi {
  // eslint-disable-next-line no-useless-constructor
  constructor(api, addresses, chain) {
    super(api, addresses, chain);
  }

  getMetadata(metadataUrl) {
    let url = metadataUrl;

    if (!(0, _utils.isUrl)(metadataUrl)) {
      url = this.parseUrl(metadataUrl);

      if (!url || url.length === 0) {
        return undefined;
      }
    }

    return (0, _crossFetch.default)(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
  }
  /**
   * Retrieve id of NFTs
   *
   * @returns the array of NFT Ids
   * @param addresses
   */


  async getNfts(addresses) {
    if (!this.dotSamaApi) {
      return [];
    }

    let accountAssets = [];
    await Promise.all(addresses.map(async address => {
      // @ts-ignore
      const resp = await this.dotSamaApi.api.query.uniques.account.keys(address);
      accountAssets = accountAssets.concat(...resp);
    }));
    const assetIds = [];

    for (const key of accountAssets) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const data = key.toHuman();
      assetIds.push({
        classId: data[1],
        tokenId: this.parseTokenId(data[2])
      });
    }

    return assetIds;
  }

  async getTokenDetails(assetId) {
    if (!this.dotSamaApi) {
      return null;
    }

    const {
      classId,
      tokenId
    } = assetId;
    const metadataNft = (await this.dotSamaApi.api.query.uniques.instanceMetadataOf(this.parseTokenId(classId), this.parseTokenId(tokenId))).toHuman();

    if (!(metadataNft !== null && metadataNft !== void 0 && metadataNft.data)) {
      return null;
    } // @ts-ignore


    return this.getMetadata(metadataNft === null || metadataNft === void 0 ? void 0 : metadataNft.data);
  }

  async getCollectionDetail(collectionId) {
    if (!this.dotSamaApi) {
      return null;
    }

    const collectionMetadata = (await this.dotSamaApi.api.query.uniques.classMetadataOf(collectionId)).toHuman();

    if (!(collectionMetadata !== null && collectionMetadata !== void 0 && collectionMetadata.data)) {
      return null;
    } // @ts-ignore


    return this.getMetadata(collectionMetadata === null || collectionMetadata === void 0 ? void 0 : collectionMetadata.data);
  }

  async handleNfts(updateItem, updateCollection, updateReady) {
    // const start = performance.now();
    const assetIds = await this.getNfts(this.addresses);

    try {
      if (!assetIds || assetIds.length === 0) {
        updateReady(true);
        return;
      }

      await Promise.all(assetIds.map(async assetId => {
        const parsedClassId = this.parseTokenId(assetId.classId);
        const parsedTokenId = this.parseTokenId(assetId.tokenId);
        const [tokenInfo, collectionMeta] = await Promise.all([this.getTokenDetails(assetId), this.getCollectionDetail(parseInt(parsedClassId))]);
        const parsedNft = {
          id: parsedTokenId,
          name: tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.name,
          description: tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.description,
          image: tokenInfo && tokenInfo.image ? this.parseUrl(tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.image) : undefined,
          collectionId: this.parseTokenId(parsedClassId),
          chain: _config.SUPPORTED_NFT_NETWORKS.statemine
        };
        updateItem(parsedNft);
        const parsedCollection = {
          collectionId: parsedClassId,
          chain: _config.SUPPORTED_NFT_NETWORKS.statemine,
          collectionName: collectionMeta === null || collectionMeta === void 0 ? void 0 : collectionMeta.name,
          image: collectionMeta && collectionMeta.image ? this.parseUrl(collectionMeta === null || collectionMeta === void 0 ? void 0 : collectionMeta.image) : undefined
        };
        updateCollection(parsedCollection);
        updateReady(true);
      }));
    } catch (e) {
      console.error('Failed to fetch statemine nft', e);
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

exports.default = StatemineNftApi;