// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

export enum SUPPORTED_STAKING_CHAIN_NAMES {
  kusama = 'kusama',
  polkadot = 'polkadot',
  astar = 'astar',
  moonbeam = 'moonbeam',
  moonriver = 'moonriver'
}

export const SUBSQUID_ENDPOINTS: Record<string, string> = {
  [SUPPORTED_STAKING_CHAIN_NAMES.kusama]: 'https://squid.subsquid.io/kusama-explorer/graphql',
  [SUPPORTED_STAKING_CHAIN_NAMES.polkadot]: 'https://squid.subsquid.io/polkadot-explorer/graphql',
  [SUPPORTED_STAKING_CHAIN_NAMES.astar]: 'https://squid.subsquid.io/astar-explorer/graphql',
  [SUPPORTED_STAKING_CHAIN_NAMES.moonriver]: 'https://squid.subsquid.io/moonriver-explorer/graphql',
  [SUPPORTED_STAKING_CHAIN_NAMES.moonbeam]: 'https://squid.subsquid.io/moonbeam-explorer/graphql'
};

export const SUPPORTED_STAKING_CHAINS = [
  SUPPORTED_STAKING_CHAIN_NAMES.polkadot as string,
  SUPPORTED_STAKING_CHAIN_NAMES.kusama as string,
  SUPPORTED_STAKING_CHAIN_NAMES.astar as string,
  SUPPORTED_STAKING_CHAIN_NAMES.moonbeam as string,
  SUPPORTED_STAKING_CHAIN_NAMES.moonriver as string
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
