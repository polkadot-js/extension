"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initMetaMask;
Object.defineProperty(exports, "packageInfo", {
  enumerable: true,
  get: function () {
    return _packageInfo.packageInfo;
  }
});

var _detectProvider = _interopRequireDefault(require("@metamask/detect-provider"));

var _web = _interopRequireDefault(require("web3"));

var _util = require("@polkadot/util");

var _packageInfo = require("./packageInfo");

// Copyright 2019-2022 @polkadot/extension-compat-metamask authors & contributors
// SPDX-License-Identifier: Apache-2.0
function isMetaMaskProvider(prov) {
  (0, _util.assert)(prov && prov.isMetaMask, 'Injected provider is not MetaMask');
  return prov;
} // transform the Web3 accounts into a simple address/name array


function transformAccounts(accounts) {
  return accounts.map((address, i) => ({
    address,
    name: `MetaMask Address #${i}`,
    type: 'ethereum'
  }));
} // add a compat interface of metaMaskSource to window.injectedWeb3


function injectMetaMaskWeb3(win) {
  // decorate the compat interface
  win.injectedWeb3.Web3Source = {
    enable: async () => {
      const providerRaw = await (0, _detectProvider.default)({
        mustBeMetaMask: true
      });
      const provider = isMetaMaskProvider(providerRaw);
      await provider.request({
        method: 'eth_requestAccounts'
      });
      return {
        accounts: {
          get: async () => {
            const response = await provider.request({
              method: 'eth_requestAccounts'
            });
            return transformAccounts(response);
          },
          subscribe: cb => {
            const sub = provider.on('accountsChanged', accounts => {
              cb(transformAccounts(accounts));
            }); // TODO: add onchainchanged

            return () => {
              sub.unsubscribe();
            };
          }
        },
        signer: {
          signRaw: async raw => {
            const signature = await provider.request({
              method: 'eth_sign',
              params: [raw.address, _web.default.utils.sha3(raw.data)]
            });
            return {
              id: 0,
              signature
            };
          }
        }
      };
    },
    version: '0' // TODO: win.ethereum.version

  };
}

function initMetaMask() {
  return new Promise(resolve => {
    const win = window;

    if (win.ethereum) {
      injectMetaMaskWeb3(win);
      resolve(true);
    } else {
      resolve(false);
    }
  });
}