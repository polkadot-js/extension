"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BitCountryNftApi = void 0;

var _crossFetch = _interopRequireDefault(require("cross-fetch"));

var _config = require("@polkadot/extension-koni-base/api/nft/config");

var _nft = require("@polkadot/extension-koni-base/api/nft/nft");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
class BitCountryNftApi extends _nft.BaseNftApi {
  // eslint-disable-next-line no-useless-constructor
  constructor(api, addresses, chain) {
    super(api, addresses, chain);
  }

  parseUrl(input) {
    if (!input || input.length === 0) {
      return undefined;
    }

    if ((0, _utils.isUrl)(input)) {
      return input;
    }

    if (!input.includes('ipfs://')) {
      return _config.BIT_COUNTRY_SERVER + input;
    }

    return _config.BIT_COUNTRY_SERVER + input.split('ipfs://')[1];
  }

  async getNfts(addresses) {
    if (!this.dotSamaApi) {
      return [];
    }

    let accountAssets = [];
    await Promise.all(addresses.map(async address => {
      // @ts-ignore
      const resp = await this.dotSamaApi.api.query.nft.assetsByOwner(address);
      const parsedResp = resp.toHuman();
      accountAssets = accountAssets.concat(parsedResp);
    }));
    const assetIds = [];

    for (const pair of accountAssets) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      assetIds.push({
        classId: this.parseTokenId(pair[0]),
        tokenId: this.parseTokenId(pair[1])
      });
    }

    return assetIds;
  }

  async getTokenDetails(assetId) {
    if (!this.dotSamaApi) {
      return null;
    }

    const onChainMeta = (await this.dotSamaApi.api.query.ormlNFT.tokens(assetId.classId, assetId.tokenId)).toHuman();

    if (!onChainMeta.metadata) {
      return null;
    }

    return await (0, _crossFetch.default)(_config.BIT_COUNTRY_SERVER + onChainMeta.metadata).then(resp => resp.json());
  }

  async getCollectionDetails(collectionId) {
    if (!this.dotSamaApi) {
      return null;
    }

    const metadataCollection = (await this.dotSamaApi.api.query.ormlNFT.classes(collectionId)).toHuman();

    if (!metadataCollection.metadata) {
      return null;
    }

    return await (0, _crossFetch.default)(_config.BIT_COUNTRY_SERVER + metadataCollection.metadata).then(resp => resp.json());
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

  async handleNfts(updateItem, updateCollection, updateReady) {
    const assetIds = await this.getNfts(this.addresses);

    try {
      if (!assetIds || assetIds.length === 0) {
        updateReady(true);
        return;
      }

      await Promise.all(assetIds.map(async assetId => {
        const parsedClassId = this.parseTokenId(assetId.classId);
        const parsedTokenId = this.parseTokenId(assetId.tokenId);
        const [tokenInfo, collectionMeta] = await Promise.all([this.getTokenDetails(assetId), this.getCollectionDetails(parsedClassId)]);
        const parsedNft = {
          id: parsedTokenId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          name: tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          description: tokenInfo && tokenInfo.description ? tokenInfo.description : collectionMeta === null || collectionMeta === void 0 ? void 0 : collectionMeta.description,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          image: tokenInfo && tokenInfo.image_url ? this.parseUrl(tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.image_url) : this.parseUrl(collectionMeta === null || collectionMeta === void 0 ? void 0 : collectionMeta.image_url),
          collectionId: parsedClassId,
          chain: _config.SUPPORTED_NFT_NETWORKS.bitcountry
        };
        const parsedCollection = {
          collectionId: parsedClassId,
          chain: _config.SUPPORTED_NFT_NETWORKS.bitcountry,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          collectionName: collectionMeta === null || collectionMeta === void 0 ? void 0 : collectionMeta.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          image: this.parseUrl(collectionMeta === null || collectionMeta === void 0 ? void 0 : collectionMeta.image_url)
        };
        updateItem(parsedNft);
        updateCollection(parsedCollection);
        updateReady(true);
      }));
    } catch (e) {
      console.error('Failed to fetch bit.country nft', e);
    }
  }

}

exports.BitCountryNftApi = BitCountryNftApi;