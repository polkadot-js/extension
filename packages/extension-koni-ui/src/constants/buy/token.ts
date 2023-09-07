// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BuyService, BuyTokenInfo, SupportService } from '@subwallet/extension-koni-ui/types';

const DEFAULT_BUY_SERVICE: BuyService = { symbol: '', network: '' };

const DEFAULT_SERVICE_INFO: Record<SupportService, BuyService> = {
  transak: { ...DEFAULT_BUY_SERVICE },
  banxa: { ...DEFAULT_BUY_SERVICE },
  onramper: { ...DEFAULT_BUY_SERVICE },
  moonpay: { ...DEFAULT_BUY_SERVICE }
};

export const PREDEFINED_BUY_TOKEN: Record<string, BuyTokenInfo> = {
  DOT: {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'mainnet',
        symbol: 'DOT'
      },
      banxa: {
        network: 'DOT',
        symbol: 'DOT'
      }
    },
    network: 'polkadot',
    slug: 'polkadot-NATIVE-DOT',
    symbol: 'DOT',
    support: 'SUBSTRATE',
    services: ['transak', 'banxa']
  },
  KSM: {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'mainnet',
        symbol: 'KSM'
      },
      banxa: {
        network: 'KSM',
        symbol: 'KSM'
      }
    },
    network: 'kusama',
    slug: 'kusama-NATIVE-KSM',
    symbol: 'KSM',
    support: 'SUBSTRATE',
    services: ['transak', 'banxa']
  },
  ASTR: {
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
  GLMR: {
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
  MOVR: {
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
  ETH: {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'ETH'
      },
      banxa: {
        network: 'ETH',
        symbol: 'ETH'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-NATIVE-ETH',
    symbol: 'ETH',
    support: 'ETHEREUM',
    services: ['transak', 'banxa']
  },
  BNB: {
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
  NEER: {
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
  }
};

export const PREDEFINED_BUY_TOKEN_BY_SLUG: Record<string, BuyTokenInfo> = Object.fromEntries(Object.values(PREDEFINED_BUY_TOKEN).map((info) => [info.slug, info]));
