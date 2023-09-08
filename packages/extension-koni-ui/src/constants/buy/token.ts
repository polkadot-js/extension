// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BuyService, BuyTokenInfo, SupportService } from '@subwallet/extension-koni-ui/types';

const DEFAULT_BUY_SERVICE: BuyService = { symbol: '', network: '' };

const DEFAULT_SERVICE_INFO: Record<SupportService, BuyService> = {
  transak: { ...DEFAULT_BUY_SERVICE },
  banxa: { ...DEFAULT_BUY_SERVICE },
  coinbase: { ...DEFAULT_BUY_SERVICE },
  onramper: { ...DEFAULT_BUY_SERVICE },
  moonpay: { ...DEFAULT_BUY_SERVICE }
};

export const MAP_PREDEFINED_BUY_TOKEN: Record<string, BuyTokenInfo> = {
  'polkadot-NATIVE-DOT': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'mainnet',
        symbol: 'DOT'
      },
      banxa: {
        network: 'DOT',
        symbol: 'DOT'
      },
      coinbase: {
        network: 'polkadot',
        symbol: 'DOT'
      }
    },
    network: 'polkadot',
    slug: 'polkadot-NATIVE-DOT',
    symbol: 'DOT',
    support: 'SUBSTRATE',
    services: ['transak', 'banxa', 'coinbase']
  },
  'kusama-NATIVE-KSM': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'mainnet',
        symbol: 'KSM'
      },
      banxa: {
        network: 'KSM',
        symbol: 'KSM'
      },
      coinbase: {
        network: 'kusama',
        symbol: 'KSM'
      }
    },
    network: 'kusama',
    slug: 'kusama-NATIVE-KSM',
    symbol: 'KSM',
    support: 'SUBSTRATE',
    services: ['transak', 'banxa', 'coinbase']
  },
  'astar-NATIVE-ASTR': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'astar',
        symbol: 'ASTR'
      }
    },
    network: 'astar',
    slug: 'astar-NATIVE-ASTR',
    symbol: 'ASTR',
    support: 'SUBSTRATE',
    services: ['transak']
  },
  'moonbeam-NATIVE-GLMR': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'mainnet',
        symbol: 'GLMR'
      },
      banxa: {
        network: 'GLMR',
        symbol: 'GLMR'
      }
    },
    network: 'moonbeam',
    slug: 'moonbeam-NATIVE-GLMR',
    symbol: 'GLMR',
    support: 'ETHEREUM',
    services: ['transak', 'banxa']
  },
  'moonriver-NATIVE-MOVR': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'moonriver',
        symbol: 'MOVR'
      }
    },
    network: 'moonriver',
    slug: 'moonriver-NATIVE-MOVR',
    symbol: 'MOVR',
    support: 'ETHEREUM',
    services: ['transak']
  },
  'ethereum-NATIVE-ETH': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'ETH'
      },
      banxa: {
        network: 'ETH',
        symbol: 'ETH'
      },
      coinbase: {
        network: 'ethereum',
        symbol: 'ETH'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-NATIVE-ETH',
    symbol: 'ETH',
    support: 'ETHEREUM',
    services: ['transak', 'banxa', 'coinbase']
  },
  'binance-NATIVE-BNB': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'bsc',
        symbol: 'BNB'
      }
    },
    network: 'binance',
    slug: 'binance-NATIVE-BNB',
    symbol: 'BNB',
    support: 'ETHEREUM',
    services: ['transak']
  },
  'pioneer-NATIVE-NEER': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'pioneer',
        symbol: 'NEER'
      }
    },
    network: 'pioneer',
    slug: 'pioneer-NATIVE-NEER',
    symbol: 'NEER',
    support: 'SUBSTRATE',
    services: ['transak']
  },
  'ethereum-ERC20-USDT-0xdAC17F958D2ee523a2206206994597C13D831ec7': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      banxa: {
        network: 'ETH',
        symbol: 'USDT'
      },
      transak: {
        network: 'ethereum',
        symbol: 'USDT'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-USDT-0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    support: 'ETHEREUM',
    services: ['banxa', 'transak']
  },
  'polygon-ERC20-USDT-0xc2132D05D31c914a87C6611C10748AEb04B58e8F': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'polygon',
        symbol: 'USDT'
      }
    },
    network: 'polygon',
    slug: 'polygon-ERC20-USDT-0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    symbol: 'USDT',
    support: 'ETHEREUM',
    services: ['transak']
  }
};

export const LIST_PREDEFINED_BUY_TOKEN = Object.values(MAP_PREDEFINED_BUY_TOKEN);
