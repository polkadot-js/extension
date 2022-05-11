"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UniqueNftApiV2 = void 0;

var _crossFetch = _interopRequireDefault(require("cross-fetch"));

var _config = require("@polkadot/extension-koni-base/api/nft/config");

var _nft = require("@polkadot/extension-koni-base/api/nft/nft");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
class UniqueNftApiV2 extends _nft.BaseNftApi {
  endpoint = _config.UNIQUE_SCAN_ENDPOINT; // eslint-disable-next-line no-useless-constructor

  constructor() {
    super();
  }

  static parseNftRequest(address) {
    return {
      // eslint-disable-next-line
      query: `query MyQuery { tokens(where: {owner: {_eq: \"${address}\"}}) { collection_id id data } }`
    };
  } // private static parseNftCollectionRequest (collectionId: string) {
  //   return {
  //     // eslint-disable-next-line
  //     query: `query MyQuery { collections(where: {collection_id: {_eq: \"${collectionId}\"}}) { collection_id name } }`
  //   };
  // }


  async getNftByAccount(address) {
    var _result$data;

    const resp = await (0, _crossFetch.default)(this.endpoint, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(UniqueNftApiV2.parseNftRequest(address))
    });
    const result = await resp.json(); // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access

    return result === null || result === void 0 ? void 0 : (_result$data = result.data) === null || _result$data === void 0 ? void 0 : _result$data.tokens;
  }

  async handleNfts(updateItem, updateCollection, updateReady) {
    let allNfts = [];

    try {
      await Promise.all(this.addresses.map(async address => {
        const nfts = await this.getNftByAccount(address);
        allNfts = allNfts.concat(nfts);
      }));
      console.log('allNfts', allNfts);
    } catch (e) {
      console.error(`Failed to fetch ${this.chain} nft`, e);
    }
  }

  async fetchNfts(updateItem, updateCollection, updateReady) {
    try {
      await this.handleNfts(updateItem, updateCollection, updateReady);
    } catch (e) {
      return 0;
    }

    return 1;
  }

}

exports.UniqueNftApiV2 = UniqueNftApiV2;