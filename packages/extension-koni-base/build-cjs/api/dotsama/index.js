"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  getGenesis: true,
  connectDotSamaApis: true
};
exports.connectDotSamaApis = connectDotSamaApis;
exports.default = void 0;
exports.getGenesis = getGenesis;

var _api = require("@polkadot/extension-koni-base/api/dotsama/api");

var _endpoints = _interopRequireDefault(require("../../api/endpoints"));

var _api2 = require("./api");

Object.keys(_api2).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _api2[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _api2[key];
    }
  });
});

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
function getGenesis(name) {
  if (_endpoints.default[name] && _endpoints.default[name].genesisHash && _endpoints.default[name].genesisHash.toLowerCase() !== 'unknown') {
    return _endpoints.default[name].genesisHash;
  }

  console.log(`Genesis hash of ${name} is not available`);
  return `not_available_genesis_hash__${name}`;
}

function connectDotSamaApis() {
  let networks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _endpoints.default;
  const apisMap = {};
  Object.keys(networks).forEach(networkKey => {
    const network = networks[networkKey];

    if (!network.genesisHash || network.genesisHash.toLowerCase() === 'unknown' || !network.provider) {
      return;
    }

    apisMap[networkKey] = (0, _api.initApi)(networkKey, network.provider);
  });
  return apisMap;
}

var _default = connectDotSamaApis;
exports.default = _default;