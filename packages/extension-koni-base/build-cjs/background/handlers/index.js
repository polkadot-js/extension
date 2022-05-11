"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = handlers;
exports.extension = exports.dotSamaAPIMap = void 0;
exports.initBackgroundWindow = initBackgroundWindow;
exports.tabs = exports.state = exports.rpcsMap = exports.nftHandler = void 0;

var _defaults = require("@polkadot/extension-base/defaults");

var _dotsama = _interopRequireDefault(require("@polkadot/extension-koni-base/api/dotsama"));

var _registry = require("@polkadot/extension-koni-base/api/dotsama/registry");

var _endpoints = _interopRequireDefault(require("@polkadot/extension-koni-base/api/endpoints"));

var _nft = require("@polkadot/extension-koni-base/api/nft");

var _Extension = _interopRequireDefault(require("@polkadot/extension-koni-base/background/handlers/Extension"));

var _State = _interopRequireDefault(require("@polkadot/extension-koni-base/background/handlers/State"));

var _Tabs = _interopRequireDefault(require("@polkadot/extension-koni-base/background/handlers/Tabs"));

var _util = require("@polkadot/util");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
const state = new _State.default();
exports.state = state;
state.initEvmTokenState();
const extension = new _Extension.default(state);
exports.extension = extension;
const tabs = new _Tabs.default(state);
exports.tabs = tabs;
const dotSamaAPIMap = (0, _dotsama.default)();
exports.dotSamaAPIMap = dotSamaAPIMap;
const nftHandler = new _nft.NftHandler(dotSamaAPIMap);
exports.nftHandler = nftHandler;

function getRpcsMap() {
  const result = {};
  Object.keys(_endpoints.default).forEach(networkKey => {
    const networkInfo = _endpoints.default[networkKey];

    if (!networkInfo.genesisHash || networkInfo.genesisHash.toLowerCase() === 'unknown') {
      return;
    }

    result[networkKey] = networkInfo.provider;
  });
  return result;
}

const rpcsMap = getRpcsMap(); // Load registry and fill to state

exports.rpcsMap = rpcsMap;
(0, _registry.initChainRegistrySubscription)();

function initBackgroundWindow(keyring) {
  window.pdotApi = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    keyring,
    apisMap: dotSamaAPIMap
  };
}

function handlers(_ref, port) {
  let {
    id,
    message,
    request
  } = _ref;
  let extensionPortName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _defaults.PORT_EXTENSION;
  const isExtension = port.name === extensionPortName;
  const sender = port.sender;
  const from = isExtension ? 'extension' : sender.tab && sender.tab.url || sender.url || '<unknown>';
  const source = `${from}: ${id}: ${message}`;
  console.log(` [in] ${source}`); // :: ${JSON.stringify(request)}`);

  const promise = isExtension ? extension.handle(id, message, request, port) : tabs.handle(id, message, request, from, port);
  promise.then(response => {
    console.log(`[out] ${source}`); // :: ${JSON.stringify(response)}`);
    // between the start and the end of the promise, the user may have closed
    // the tab, in which case port will be undefined

    (0, _util.assert)(port, 'Port has been disconnected');
    port.postMessage({
      id,
      response
    });
  }).catch(error => {
    console.log(`[err] ${source}:: ${error.message}`); // only send message back to port if it's still connected

    if (port) {
      port.postMessage({
        error: error.message,
        id
      });
    }
  });
}