// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const SUBSQUID_ENDPOINTS: Record<string, string> = {
  kusama: 'https://app.gc.subsquid.io/beta/subwallet-kusama/v10/graphql',
  polkadot: 'https://app.gc.subsquid.io/beta/subwallet-polkadot/v10/graphql',
  astar: 'https://app.gc.subsquid.io/beta/subwallet-astar/v10/graphql',
  hydradx: 'https://app.gc.subsquid.io/beta/subwallet-hydradx/v10/graphql'
};

export const SUPPORTED_STAKING_CHAINS = [
  'polkadot',
  'kusama',
  'astar',
  'hydradx'
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
