"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SUPPORTED_STAKING_CHAIN_NAMES = exports.SUPPORTED_STAKING_CHAINS = exports.SUBSQUID_ENDPOINTS = exports.SUBQUERY_ENDPOINTS = void 0;
// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
let SUPPORTED_STAKING_CHAIN_NAMES;
exports.SUPPORTED_STAKING_CHAIN_NAMES = SUPPORTED_STAKING_CHAIN_NAMES;

(function (SUPPORTED_STAKING_CHAIN_NAMES) {
  SUPPORTED_STAKING_CHAIN_NAMES["kusama"] = "kusama";
  SUPPORTED_STAKING_CHAIN_NAMES["polkadot"] = "polkadot";
  SUPPORTED_STAKING_CHAIN_NAMES["astar"] = "astar";
  SUPPORTED_STAKING_CHAIN_NAMES["hydradx"] = "hydradx";
})(SUPPORTED_STAKING_CHAIN_NAMES || (exports.SUPPORTED_STAKING_CHAIN_NAMES = SUPPORTED_STAKING_CHAIN_NAMES = {}));

const SUBSQUID_ENDPOINTS = {
  [SUPPORTED_STAKING_CHAIN_NAMES.kusama]: 'https://app.gc.subsquid.io/beta/kusama-explorer/v1/graphql',
  [SUPPORTED_STAKING_CHAIN_NAMES.polkadot]: 'https://app.gc.subsquid.io/beta/polkadot-explorer/v1/graphql',
  [SUPPORTED_STAKING_CHAIN_NAMES.astar]: 'https://app.gc.subsquid.io/beta/astar-explorer/v1/graphql',
  [SUPPORTED_STAKING_CHAIN_NAMES.hydradx]: 'https://app.gc.subsquid.io/beta/hydradx-explorer/v1/graphql'
};
exports.SUBSQUID_ENDPOINTS = SUBSQUID_ENDPOINTS;
const SUPPORTED_STAKING_CHAINS = [SUPPORTED_STAKING_CHAIN_NAMES.polkadot, SUPPORTED_STAKING_CHAIN_NAMES.kusama, SUPPORTED_STAKING_CHAIN_NAMES.astar, SUPPORTED_STAKING_CHAIN_NAMES.hydradx];
exports.SUPPORTED_STAKING_CHAINS = SUPPORTED_STAKING_CHAINS;
const SUBQUERY_ENDPOINTS = {
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
exports.SUBQUERY_ENDPOINTS = SUBQUERY_ENDPOINTS;