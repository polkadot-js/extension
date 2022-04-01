// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

export enum SUPPORTED_STAKING_CHAIN_NAMES {
  kusama = 'kusama',
  polkadot = 'polkadot',
  astar = 'astar',
  hydradx = 'hydradx'
}

export const SUBSQUID_ENDPOINTS: Record<string, string> = {
  [SUPPORTED_STAKING_CHAIN_NAMES.kusama]: 'https://app.gc.subsquid.io/beta/kusama-explorer/v1/graphql',
  [SUPPORTED_STAKING_CHAIN_NAMES.polkadot]: 'https://app.gc.subsquid.io/beta/polkadot-explorer/v1/graphql',
  [SUPPORTED_STAKING_CHAIN_NAMES.astar]: 'https://app.gc.subsquid.io/beta/astar-explorer/v1/graphql',
  [SUPPORTED_STAKING_CHAIN_NAMES.hydradx]: 'https://app.gc.subsquid.io/beta/hydradx-explorer/v1/graphql'
};

export const SUPPORTED_STAKING_CHAINS = [
  SUPPORTED_STAKING_CHAIN_NAMES.polkadot,
  SUPPORTED_STAKING_CHAIN_NAMES.kusama,
  SUPPORTED_STAKING_CHAIN_NAMES.astar,
  SUPPORTED_STAKING_CHAIN_NAMES.hydradx
];

export const SUBQUERY_ENDPOINTS: Record<string, string> = {
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
