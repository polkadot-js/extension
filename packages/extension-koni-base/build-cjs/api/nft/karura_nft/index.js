"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KaruraNftApi = void 0;

var _crossFetch = _interopRequireDefault(require("cross-fetch"));

var _config = require("@polkadot/extension-koni-base/api/nft/config");

var _nft = require("@polkadot/extension-koni-base/api/nft/nft");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
class KaruraNftApi extends _nft.BaseNftApi {
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
      return _config.CLOUDFLARE_SERVER + input;
    }

    return _config.CLOUDFLARE_SERVER + input.split('ipfs://')[1];
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
      const resp = await this.dotSamaApi.api.query.ormlNFT.tokensByOwner.keys(address);
      accountAssets = accountAssets.concat(resp);
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

  async getCollectionDetails(collectionId) {
    if (!this.dotSamaApi) {
      return null;
    }

    const metadataCollection = (await this.dotSamaApi.api.query.ormlNFT.classes(collectionId)).toHuman();

    if (!(metadataCollection !== null && metadataCollection !== void 0 && metadataCollection.metadata)) {
      return null;
    }

    const data = await getKaruraMetadata(metadataCollection === null || metadataCollection === void 0 ? void 0 : metadataCollection.metadata);
    return { ...data,
      image: this.parseUrl(data.image)
    };
  }

  async getTokenDetails(assetId) {
    if (!this.dotSamaApi) {
      return null;
    }

    return (await this.dotSamaApi.api.query.ormlNFT.tokens(assetId.classId, assetId.tokenId)).toHuman();
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
        const [tokenInfo, collectionMeta] = await Promise.all([this.getTokenDetails(assetId), this.getCollectionDetails(parseInt(parsedClassId))]);
        const parsedNft = {
          id: parsedTokenId,
          name: tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.name,
          description: tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.description,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          image: tokenInfo && tokenInfo.image ? this.parseUrl(tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.image) : collectionMeta === null || collectionMeta === void 0 ? void 0 : collectionMeta.image,
          collectionId: parsedClassId,
          chain: _config.SUPPORTED_NFT_NETWORKS.karura
        };
        const parsedCollection = {
          collectionId: parsedClassId,
          chain: _config.SUPPORTED_NFT_NETWORKS.karura,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          collectionName: collectionMeta === null || collectionMeta === void 0 ? void 0 : collectionMeta.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          image: collectionMeta === null || collectionMeta === void 0 ? void 0 : collectionMeta.image
        };
        updateItem(parsedNft);
        updateCollection(parsedCollection);
        updateReady(true);
      }));
    } catch (e) {
      console.error('Failed to fetch karura nft', e);
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

exports.KaruraNftApi = KaruraNftApi;

const getKaruraMetadata = metadataUrl => {
  let url = metadataUrl;

  if (!metadataUrl) {
    return null;
  }

  url = _config.CLOUDFLARE_SERVER + metadataUrl + '/metadata.json';
  return (0, _crossFetch.default)(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => res.json());
};