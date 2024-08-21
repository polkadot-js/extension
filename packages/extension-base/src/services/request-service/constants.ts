// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const EXTENSION_REQUEST_URL = 'extension';

export const PREDEFINED_CHAIN_DAPP_CHAIN_MAP: Record<string, string[]> = {
  'portal.astar.network': ['astar', 'astarEvm'],
  'apps.moonbeam.network': ['moonbeam', 'moonriver'],
  'app.stellaswap.com': ['moonbeam']
};

export const WEB_APP_URL = [
  /// Web app
  'localhost:9000', // Local
  'subwallet-webapp.pages.dev', // Pull request build
  'web.subwallet.app' // Production,
];

export const DAPP_CONNECT_ALL_TYPE_ACCOUNT_URL = [
  'https://polkadot.js.org/apps/',
  'https://ipfs.io/ipns/dotapps.io'
];
