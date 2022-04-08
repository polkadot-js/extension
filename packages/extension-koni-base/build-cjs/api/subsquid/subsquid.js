"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSubsquidStakingReward = exports.client = exports.SUBSQUID_STAKING_QUERY = void 0;

var _client = require("@apollo/client");

var _axios = _interopRequireDefault(require("axios"));

var _crossFetch = _interopRequireDefault(require("cross-fetch"));

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
const client = new _client.ApolloClient({
  cache: new _client.InMemoryCache(),
  link: (0, _client.createHttpLink)({
    uri: 'https://app.gc.subsquid.io/beta/subwallet-polkadot/v4/graphql',
    fetch: _crossFetch.default
  })
});
exports.client = client;
const SUBSQUID_STAKING_QUERY = (0, _client.gql)`
  query MyQuery {
    rewards(limit: 10, orderBy: date_DESC, where: {account_eq: "17bR6rzVsVrzVJS1hM4dSJU43z2MUmz7ZDpPLh8y2fqVg7m"}) {
      amount
      account
      blockNumber
      date
    }
  }
`;
exports.SUBSQUID_STAKING_QUERY = SUBSQUID_STAKING_QUERY;

const getSubsquidStakingReward = async account => {
  const resp = await (0, _axios.default)({
    url: 'https://app.gc.subsquid.io/beta/subwallet-polkadot/v4/graphql',
    method: 'post',
    data: {
      query: `
        query MyQuery {
          rewards(limit: 10, where: {account_eq: "${account}"}, orderBy: blockNumber_DESC) {
            blockNumber
            amount
            account
            id
            date
          }
        }
      `
    }
  });

  if (resp.status === 200) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return resp.data.data;
  }

  return {};
};

exports.getSubsquidStakingReward = getSubsquidStakingReward;