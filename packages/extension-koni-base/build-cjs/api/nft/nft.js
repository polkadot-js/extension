"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BaseNftApi = void 0;

var _config = require("@polkadot/extension-koni-base/api/nft/config");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
class BaseNftApi {
  chain = null;
  dotSamaApi = null;
  data = [];
  total = 0;
  addresses = [];

  constructor(api, addresses, chain) {
    if (api) {
      this.dotSamaApi = api;
    }

    if (addresses) {
      this.addresses = addresses;
    }

    if (chain) {
      this.chain = chain;
    }
  }

  async connect() {
    var _this$dotSamaApi;

    if (!((_this$dotSamaApi = this.dotSamaApi) !== null && _this$dotSamaApi !== void 0 && _this$dotSamaApi.isApiConnected)) {
      var _this$dotSamaApi2;

      this.dotSamaApi = await ((_this$dotSamaApi2 = this.dotSamaApi) === null || _this$dotSamaApi2 === void 0 ? void 0 : _this$dotSamaApi2.isReady);
    }
  }

  recoverConnection() {
    var _this$dotSamaApi3;

    if (!((_this$dotSamaApi3 = this.dotSamaApi) !== null && _this$dotSamaApi3 !== void 0 && _this$dotSamaApi3.isApiConnected)) {
      var _this$dotSamaApi4;

      ((_this$dotSamaApi4 = this.dotSamaApi) === null || _this$dotSamaApi4 === void 0 ? void 0 : _this$dotSamaApi4.recoverConnect) && this.dotSamaApi.recoverConnect();
    }
  }

  getDotSamaApi() {
    return this.dotSamaApi;
  }

  getChain() {
    return this.chain;
  }

  getTotal() {
    return this.total;
  }

  getData() {
    return this.data;
  }

  setApi(api) {
    this.dotSamaApi = api;
  }

  setChain(chain) {
    this.chain = chain;
  }

  setAddresses(addresses) {
    this.addresses = addresses;
  }

  parseTokenId(tokenId) {
    if (tokenId.includes(',')) {
      return tokenId.replace(',', '');
    }

    return tokenId;
  }

  parseUrl(input) {
    if (!input || input.length === 0) {
      return undefined;
    }

    if ((0, _utils.isUrl)(input)) {
      return input;
    }

    if (!input.includes('ipfs://')) {
      return _config.RMRK_PINATA_SERVER + input;
    }

    return _config.RMRK_PINATA_SERVER + input.split('ipfs://ipfs/')[1];
  } // Sub-class implements this function to parse data into prop result


}

exports.BaseNftApi = BaseNftApi;