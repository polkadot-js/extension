// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';

export const SUBSQUID_ENDPOINTS: Record<string, string> = {
  [COMMON_CHAIN_SLUGS.KUSAMA]: 'https://squid.subsquid.io/kusama-explorer/graphql',
  [COMMON_CHAIN_SLUGS.POLKADOT]: 'https://squid.subsquid.io/polkadot-explorer/graphql',
  [COMMON_CHAIN_SLUGS.ASTAR]: 'https://squid.subsquid.io/astar-explorer/graphql',
  [COMMON_CHAIN_SLUGS.MOONRIVER]: 'https://squid.subsquid.io/moonriver-explorer/graphql',
  [COMMON_CHAIN_SLUGS.MOONBEAM]: 'https://squid.subsquid.io/moonbeam-explorer/graphql'
};

export const INDEXER_SUPPORTED_STAKING_CHAINS = [
  COMMON_CHAIN_SLUGS.POLKADOT as string,
  COMMON_CHAIN_SLUGS.KUSAMA as string,
  COMMON_CHAIN_SLUGS.ASTAR as string,
  COMMON_CHAIN_SLUGS.MOONRIVER as string,
  COMMON_CHAIN_SLUGS.MOONBEAM as string
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
