"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getEVMBalance = getEVMBalance;

var _web = require("@polkadot/extension-koni-base/api/web3/web3");

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
async function getEVMBalance(networkKey, addresses) {
  const web3Api = (0, _web.getWeb3Api)(networkKey);
  return await Promise.all(addresses.map(async address => {
    return await web3Api.eth.getBalance(address);
  }));
}