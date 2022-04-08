"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchDotSamaHistory = exports.HistoryApiMap = exports.DOTSAMA_HISTORY_QUERY = void 0;

var _client = require("@apollo/client");

var _endpoints = _interopRequireDefault(require("@polkadot/extension-koni-base/api/endpoints"));

var _subquery = require("@polkadot/extension-koni-base/api/subquery/subquery");

var _handlers = require("@polkadot/extension-koni-base/background/handlers");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
const HistoryApiMap = {
  polkadot: 'https://api.subquery.network/sq/nova-wallet/nova-westend',
  kusama: 'https://api.subquery.network/sq/nova-wallet/nova-kusama',
  westend: 'https://api.subquery.network/sq/nova-wallet/nova-westend',
  picasso: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-picasso',
  calamari: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-calamari',
  khala: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-khala',
  parallel: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-parallel',
  bifrost: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-bifrost',
  clover: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-clover',
  basilisk: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-basilisk',
  acala: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-acala',
  astar: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-astar',
  karura: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-karura',
  altair: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-altair',
  kilt: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-kilt',
  robonomics: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-robonomics',
  statemint: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-statemint',
  quartz: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-quartz',
  zeigeist: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-zeitgeist',
  shiden: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-shiden',
  statemine: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-statemine',
  moonbeam: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-moonbeam',
  moonriver: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-moonriver',
  pioneer: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-bit-country'
};
exports.HistoryApiMap = HistoryApiMap;

function getApolloClient(networkKey) {
  return (0, _subquery.newApolloClient)(HistoryApiMap[networkKey]);
}

const DOTSAMA_HISTORY_QUERY = (0, _client.gql)`
    query DotSamaHistory($first: Int = 100, $address: String = null) {
        historyElements (first: $first, filter: {address: {equalTo: $address}}) {
            nodes {
                id
                blockNumber
                extrinsicIdx
                extrinsicHash
                timestamp
                address
                reward
                extrinsic
                transfer
            }
        }
    }
`; // eslint-disable-next-line camelcase

exports.DOTSAMA_HISTORY_QUERY = DOTSAMA_HISTORY_QUERY;

function getHistoryAction(address, node) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return address === (node === null || node === void 0 ? void 0 : node.transfer.from) ? 'send' : 'received';
}

function isHistoryChange(networkKey, items) {
  const historyMap = _handlers.state.getHistoryMap();

  const originLength = !!historyMap[networkKey] && historyMap[networkKey].length || 0;
  return originLength !== items.length;
}

const fetchDotSamaHistory = (address, callBack) => {
  if ((0, _utils.isAccountAll)(address)) {
    callBack({});
    return;
  }

  const historyMap = {};
  Object.entries(_endpoints.default).forEach(_ref => {
    let [networkKey, networkInfo] = _ref;

    if (!HistoryApiMap[networkKey]) {
      _handlers.state.getTransactionHistory(address, networkKey, items => {
        if (isHistoryChange(networkKey, items)) {
          historyMap[networkKey] = items;
          callBack(historyMap);
        }
      });

      return;
    }

    const formattedAddress = (0, _utils.reformatAddress)(address, networkInfo.ss58Format, networkInfo.isEthereum); // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    // @ts-ignore

    getApolloClient(networkKey).query({
      query: DOTSAMA_HISTORY_QUERY,
      variables: {
        first: 0,
        address: formattedAddress
      }
    }).then(rs => {
      var _rs$data, _rs$data$historyEleme, _rs$data2, _rs$data2$historyElem;

      if (!(rs !== null && rs !== void 0 && (_rs$data = rs.data) !== null && _rs$data !== void 0 && (_rs$data$historyEleme = _rs$data.historyElements) !== null && _rs$data$historyEleme !== void 0 && _rs$data$historyEleme.nodes)) {
        return;
      }

      const items = [];
      rs === null || rs === void 0 ? void 0 : (_rs$data2 = rs.data) === null || _rs$data2 === void 0 ? void 0 : (_rs$data2$historyElem = _rs$data2.historyElements) === null || _rs$data2$historyElem === void 0 ? void 0 : _rs$data2$historyElem.nodes.filter(n => !!n).forEach(n => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!(n !== null && n !== void 0 && n.transfer) || !n.extrinsicHash) {
          return;
        }

        items.push({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          action: getHistoryAction(formattedAddress, n),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          change: n.transfer.success ? n.transfer.amount : '0',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          extrinsicHash: n.extrinsicHash,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          fee: n.transfer.fee,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          isSuccess: n.transfer.success,
          networkKey,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          time: +n.timestamp * 1000
        });
      });

      if (isHistoryChange(networkKey, items)) {
        historyMap[networkKey] = items;
        callBack(historyMap);
      }
    }).catch(e => {
      console.log(`History API of ${networkKey} is error`, e);
    });
  });
};

exports.fetchDotSamaHistory = fetchDotSamaHistory;