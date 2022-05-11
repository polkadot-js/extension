"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = handler;

var _util = require("@polkadot/util");

var _defaults = require("../../defaults");

var _Extension = _interopRequireDefault(require("./Extension"));

var _State = _interopRequireDefault(require("./State"));

var _Tabs = _interopRequireDefault(require("./Tabs"));

// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0
const state = new _State.default();
const extension = new _Extension.default(state);
const tabs = new _Tabs.default(state);

function handler(_ref, port) {
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