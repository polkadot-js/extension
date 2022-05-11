"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ethereumChains = void 0;
exports.getChainTypes = getChainTypes;
exports.typesBundle = exports.moonbeamBaseChains = void 0;
Object.defineProperty(exports, "typesChain", {
  enumerable: true,
  get: function () {
    return _chain.default;
  }
});

var _chain = _interopRequireDefault(require("./chain"));

var _spec = _interopRequireDefault(require("./spec"));

// Copyright 2017-2022 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0
function getChainTypes(_specName, chainName) {
  return { ...(_chain.default[chainName] || {})
  };
}

const moonbeamBaseChains = ['moonbase', 'moonbeam', 'moonriver'];
exports.moonbeamBaseChains = moonbeamBaseChains;
const ethereumChains = ['moonbase', 'moonbeam', 'moonriver', 'moonshadow', 'astarEvm', 'shidenEvm', 'origintrail-parachain'];
exports.ethereumChains = ethereumChains;
const typesBundle = {
  spec: _spec.default
};
exports.typesBundle = typesBundle;