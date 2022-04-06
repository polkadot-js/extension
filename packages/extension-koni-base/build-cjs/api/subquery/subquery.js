"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.newApolloClient = newApolloClient;

var _client = require("@apollo/client");

var _crossFetch = _interopRequireDefault(require("cross-fetch"));

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
function newApolloClient(uri) {
  return new _client.ApolloClient({
    cache: new _client.InMemoryCache(),
    link: (0, _client.createHttpLink)({
      uri: uri,
      fetch: _crossFetch.default
    })
  });
}