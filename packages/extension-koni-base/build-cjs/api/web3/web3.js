"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.web3Map = exports.getWeb3Api = exports.getERC20Contract = exports.connectWeb3Apis = exports.TestERC721Contract = exports.ERC721Contract = exports.ERC20Contract = void 0;

var _web = _interopRequireDefault(require("web3"));

var _endpoints = require("@polkadot/extension-koni-base/api/endpoints");

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
const ERC20Contract = require('./api-helper/ERC20Contract.json'); // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment


exports.ERC20Contract = ERC20Contract;

const ERC721Contract = require('./api-helper/ERC721Contract.json'); // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment


exports.ERC721Contract = ERC721Contract;

const TestERC721Contract = require('./api-helper/TestERC721Contract.json');

exports.TestERC721Contract = TestERC721Contract;

const connectWeb3Apis = function () {
  let networks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _endpoints.EVM_NETWORKS;
  const apiMap = {};
  Object.entries(networks).forEach(_ref => {
    let [networkKey, networkInfo] = _ref;

    if (networkInfo && networkInfo.provider) {
      apiMap[networkKey] = new _web.default(networkInfo.provider);
    }
  });
  return apiMap;
};

exports.connectWeb3Apis = connectWeb3Apis;
const web3Map = connectWeb3Apis();
exports.web3Map = web3Map;

const getWeb3Api = networkKey => {
  return web3Map[networkKey];
};

exports.getWeb3Api = getWeb3Api;

const getERC20Contract = function (networkKey, assetAddress) {
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return new web3Map[networkKey].eth.Contract(ERC20Contract.abi, assetAddress, options);
};

exports.getERC20Contract = getERC20Contract;