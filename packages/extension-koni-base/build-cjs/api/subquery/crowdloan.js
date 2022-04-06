"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchDotSamaCrowdloan = exports.DOTSAMA_CROWDLOAN_QUERY = exports.CrowdloanClientMap = void 0;

var _client = require("@apollo/client");

var _endpoints = _interopRequireDefault(require("@polkadot/extension-koni-base/api/endpoints"));

var _subquery = require("@polkadot/extension-koni-base/api/subquery/subquery");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
const CrowdloanClientMap = {
  polkadotCrowdloan: (0, _subquery.newApolloClient)('https://api.subquery.network/sq/subvis-io/polkadot-auctions-and-crowdloans'),
  kusamaCrowdloan: (0, _subquery.newApolloClient)('https://api.subquery.network/sq/subvis-io/kusama-crowdloans-and-auctions-v2')
};
exports.CrowdloanClientMap = CrowdloanClientMap;
const DOTSAMA_CROWDLOAN_QUERY = (0, _client.gql)`
    query DotSamaCrowdloan($first: Int = 100, $offset: Int = 0) {
        crowdloans (first: $first, offset: $offset) {
            nodes {
                id
                parachainId
                depositor
                verifier
                cap
                raised
                lockExpiredBlock
                blockNum
                firstSlot
                lastSlot
                status
                leaseExpiredBlock
                dissolvedBlock
                updatedAt
                createdAt
                isFinished
                wonAuctionId
            }
        }
    }
`;
exports.DOTSAMA_CROWDLOAN_QUERY = DOTSAMA_CROWDLOAN_QUERY;

const fetchDotSamaCrowdloan = async () => {
  var _polkadotCrowdloan$da, _polkadotCrowdloan$da2, _kusamaCrowdloan$data, _kusamaCrowdloan$data2;

  const paraMap = {};
  Object.entries(_endpoints.default).forEach(_ref => {
    let [networkKey, network] = _ref;
    let prefix = '';

    if (network.groups.indexOf('POLKADOT_PARACHAIN') > -1) {
      prefix = 'polkadot-';
    }

    if (network.groups.indexOf('KUSAMA_PARACHAIN') > -1) {
      prefix = 'kusama-';
    }

    if (network.paraId) {
      paraMap[prefix + String(network.paraId)] = networkKey;
    }
  }); // eslint-disable-next-line camelcase

  const crowdloanMap = {};
  const [polkadotCrowdloan, kusamaCrowdloan] = await Promise.all([CrowdloanClientMap.polkadotCrowdloan.query({
    query: DOTSAMA_CROWDLOAN_QUERY
  }), CrowdloanClientMap.kusamaCrowdloan.query({
    query: DOTSAMA_CROWDLOAN_QUERY
  })]);
  const paraList = [];
  polkadotCrowdloan === null || polkadotCrowdloan === void 0 ? void 0 : (_polkadotCrowdloan$da = polkadotCrowdloan.data) === null || _polkadotCrowdloan$da === void 0 ? void 0 : (_polkadotCrowdloan$da2 = _polkadotCrowdloan$da.crowdloans) === null || _polkadotCrowdloan$da2 === void 0 ? void 0 : _polkadotCrowdloan$da2.nodes.forEach(node => {
    let parachainId = node === null || node === void 0 ? void 0 : node.parachainId.substring(0, 4);
    parachainId = parachainId ? `polkadot-${parachainId}` : '';
    paraList.push(parachainId);

    if (parachainId && paraMap[parachainId]) {
      // @ts-ignore
      crowdloanMap[paraMap[parachainId]] = node;
    } else {
      console.warn('Not found parachainID', parachainId);
    }
  });
  kusamaCrowdloan === null || kusamaCrowdloan === void 0 ? void 0 : (_kusamaCrowdloan$data = kusamaCrowdloan.data) === null || _kusamaCrowdloan$data === void 0 ? void 0 : (_kusamaCrowdloan$data2 = _kusamaCrowdloan$data.crowdloans) === null || _kusamaCrowdloan$data2 === void 0 ? void 0 : _kusamaCrowdloan$data2.nodes.forEach(node => {
    let parachainId = node === null || node === void 0 ? void 0 : node.parachainId.substring(0, 4);
    parachainId = parachainId ? `kusama-${parachainId}` : '';
    paraList.push(parachainId);

    if (parachainId && paraMap[parachainId]) {
      // @ts-ignore
      crowdloanMap[paraMap[parachainId]] = node;
    } else {
      console.warn('Not found parachainID', parachainId);
    }
  });
  return crowdloanMap;
};

exports.fetchDotSamaCrowdloan = fetchDotSamaCrowdloan;