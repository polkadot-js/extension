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
    services: [
      'transak'
    ]
  },
  'avalanche_c-NATIVE-AVAX': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'avaxcchain',
        symbol: 'AVAX'
      },
      coinbase: {
        network: 'avalanche-c-chain',
        symbol: 'AVAX'
      }
    },
    network: 'avalanche_c',
    slug: 'avalanche_c-NATIVE-AVAX',
    symbol: 'AVAX',
    support: 'ETHEREUM',
    services: [
      'transak',
      'coinbase'
    ]
  },
  'aleph-NATIVE-AZERO': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'alephzero',
        symbol: 'AZERO'
      }
    },
    network: 'aleph',
    slug: 'aleph-NATIVE-AZERO',
    symbol: 'AZERO',
    support: 'SUBSTRATE',
    services: [
      'transak'
    ]
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
    services: [
      'transak'
    ]
  },
  'ternoa-NATIVE-CAPS': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      banxa: {
        network: 'TERNOA',
        symbol: 'CAPS'
      }
    },
    network: 'ternoa',
    slug: 'ternoa-NATIVE-CAPS',
    symbol: 'CAPS',
    support: 'SUBSTRATE',
    services: [
      'banxa'
    ]
  },
  'dockPosMainnet-NATIVE-DOCK': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'mainnet',
        symbol: 'DOCK'
      }
    },
    network: 'dockPosMainnet',
    slug: 'dockPosMainnet-NATIVE-DOCK',
    symbol: 'DOCK',
    support: 'SUBSTRATE',
    services: [
      'transak'
    ]
  },
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
    services: [
      'transak',
      'banxa',
      'coinbase'
    ]
  },
  'arbitrum_one-NATIVE-ETH': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'arbitrum',
        symbol: 'ETH'
      },
      coinbase: {
        network: 'arbitrum',
        symbol: 'ETH'
      }
    },
    network: 'arbitrum_one',
    slug: 'arbitrum_one-NATIVE-ETH',
    symbol: 'ETH',
    support: 'ETHEREUM',
    services: [
      'transak',
      'coinbase'
    ]
  },
  'base_mainnet-NATIVE-ETH': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'base',
        symbol: 'ETH'
      },
      coinbase: {
        network: 'base',
        symbol: 'ETH'
      }
    },
    network: 'base_mainnet',
    slug: 'base_mainnet-NATIVE-ETH',
    symbol: 'ETH',
    support: 'ETHEREUM',
    services: [
      'transak',
      'coinbase'
    ]
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
    services: [
      'transak',
      'banxa',
      'coinbase'
    ]
  },
  'optimism-NATIVE-ETH': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'optimism',
        symbol: 'ETH'
      },
      coinbase: {
        network: 'optimism',
        symbol: 'ETH'
      }
    },
    network: 'optimism',
    slug: 'optimism-NATIVE-ETH',
    symbol: 'ETH',
    support: 'ETHEREUM',
    services: [
      'transak',
      'coinbase'
    ]
  },
  'fantom-NATIVE-FTM': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'fantom',
        symbol: 'FTM'
      },
      banxa: {
        network: 'FTM',
        symbol: 'FTM'
      }
    },
    network: 'fantom',
    slug: 'fantom-NATIVE-FTM',
    symbol: 'FTM',
    support: 'ETHEREUM',
    services: [
      'transak',
      'banxa'
    ]
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
    services: [
      'transak',
      'banxa'
    ]
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
    services: [
      'transak',
      'banxa',
      'coinbase'
    ]
  },
  'polygon-NATIVE-MATIC': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'polygon',
        symbol: 'MATIC'
      },
      banxa: {
        network: 'MATIC',
        symbol: 'MATIC'
      },
      coinbase: {
        network: 'polygon',
        symbol: 'MATIC'
      }
    },
    network: 'polygon',
    slug: 'polygon-NATIVE-MATIC',
    symbol: 'MATIC',
    support: 'ETHEREUM',
    services: [
      'transak',
      'banxa',
      'coinbase'
    ]
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
    services: [
      'transak'
    ]
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
    services: [
      'transak'
    ]
  },
  'ethereum-ERC20-1INCH-0x111111111117dC0aa78b770fA6A738034120C302': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: '1INCH'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-1INCH-0x111111111117dC0aa78b770fA6A738034120C302',
    symbol: '1INCH',
    support: 'ETHEREUM',
    services: [
      'transak'
    ]
  },
  'ethereum-ERC20-APE-0x4d224452801ACEd8B2F0aebE155379bb5D594381': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'APE'
      },
      banxa: {
        network: 'ETH',
        symbol: 'APE'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-APE-0x4d224452801ACEd8B2F0aebE155379bb5D594381',
    symbol: 'APE',
    support: 'ETHEREUM',
    services: [
      'transak',
      'banxa'
    ]
  },
  'ethereum-ERC20-BAT-0x0D8775F648430679A709E98d2b0Cb6250d2887EF': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'BAT'
      },
      banxa: {
        network: 'ETH',
        symbol: 'BAT'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-BAT-0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
    symbol: 'BAT',
    support: 'ETHEREUM',
    services: [
      'transak',
      'banxa'
    ]
  },
  'boba-ERC20-BOBA-0xa18bf3994c0cc6e3b63ac420308e5383f53120d7': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      banxa: {
        network: 'BOBA',
        symbol: 'BOBA'
      }
    },
    network: 'boba',
    slug: 'boba-ERC20-BOBA-0xa18bf3994c0cc6e3b63ac420308e5383f53120d7',
    symbol: 'BOBA',
    support: 'ETHEREUM',
    services: [
      'banxa'
    ]
  },
  // 'binance-ERC20-BUSD-0xe9e7cea3dedca5984780bafc599bd69add087d56': {
  //   serviceInfo: {
  //     ...DEFAULT_SERVICE_INFO,
  //     transak: {
  //       network: 'bsc',
  //       symbol: 'BUSD'
  //     }
  //   },
  //   network: 'binance',
  //   slug: 'binance-ERC20-BUSD-0xe9e7cea3dedca5984780bafc599bd69add087d56',
  //   symbol: 'BUSD',
  //   support: 'ETHEREUM',
  //   services: [
  //     'transak'
  //   ]
  // },
  'ethereum-ERC20-BUSD-0x4Fabb145d64652a948d72533023f6E7A623C7C53': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'BUSD'
      },
      banxa: {
        network: 'ETH',
        symbol: 'BUSD'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-BUSD-0x4Fabb145d64652a948d72533023f6E7A623C7C53',
    symbol: 'BUSD',
    support: 'ETHEREUM',
    services: [
      'transak',
      'banxa'
    ]
  },
  'ethereum-ERC20-CHZ-0x3506424F91fD33084466F402d5D97f05F8e3b4AF': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      banxa: {
        network: 'ETH',
        symbol: 'CHZ'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-CHZ-0x3506424F91fD33084466F402d5D97f05F8e3b4AF',
    symbol: 'CHZ',
    support: 'ETHEREUM',
    services: [
      'banxa'
    ]
  },
  'ethereum-ERC20-COMP-0xc00e94Cb662C3520282E6f5717214004A7f26888': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'COMP'
      },
      banxa: {
        network: 'ETH',
        symbol: 'COMP'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-COMP-0xc00e94Cb662C3520282E6f5717214004A7f26888',
    symbol: 'COMP',
    support: 'ETHEREUM',
    services: [
      'transak',
      'banxa'
    ]
  },
  'binance-ERC20-Cake-0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      banxa: {
        network: 'BSC',
        symbol: 'CAKE'
      }
    },
    network: 'binance',
    slug: 'binance-ERC20-Cake-0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    symbol: 'Cake',
    support: 'ETHEREUM',
    services: [
      'banxa'
    ]
  },
  'ethereum-ERC20-DAI-0x6B175474E89094C44Da98b954EedeAC495271d0F': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'DAI'
      },
      coinbase: {
        network: 'ethereum',
        symbol: 'DAI'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-DAI-0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    support: 'ETHEREUM',
    services: [
      'transak',
      'coinbase'
    ]
  },
  'ethereum-ERC20-ENJ-0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      banxa: {
        network: 'ETH',
        symbol: 'ENJ'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-ENJ-0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c',
    symbol: 'ENJ',
    support: 'ETHEREUM',
    services: [
      'banxa'
    ]
  },
  'ethereum-ERC20-LINK-0x514910771AF9Ca656af840dff83E8264EcF986CA': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'LINK'
      },
      banxa: {
        network: 'ETH',
        symbol: 'LINK'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-LINK-0x514910771AF9Ca656af840dff83E8264EcF986CA',
    symbol: 'LINK',
    support: 'ETHEREUM',
    services: [
      'transak',
      'banxa'
    ]
  },
  'ethereum-ERC20-MATIC-0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      coinbase: {
        network: 'ethereum',
        symbol: 'MATIC'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-MATIC-0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    symbol: 'MATIC',
    support: 'ETHEREUM',
    services: [
      'coinbase'
    ]
  },
  'ethereum-ERC20-MKR-0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'MKR'
      },
      banxa: {
        network: 'ETH',
        symbol: 'MKR'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-MKR-0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    symbol: 'MKR',
    support: 'ETHEREUM',
    services: [
      'transak',
      'banxa'
    ]
  },
  'optimism-ERC20-OP-0x4200000000000000000000000000000000000042': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      coinbase: {
        network: 'optimism',
        symbol: 'OP'
      }
    },
    network: 'optimism',
    slug: 'optimism-ERC20-OP-0x4200000000000000000000000000000000000042',
    symbol: 'OP',
    support: 'ETHEREUM',
    services: [
      'coinbase'
    ]
  },
  'ethereum-ERC20-SAND-0x3845badAde8e6dFF049820680d1F14bD3903a5d0': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'SAND'
      },
      banxa: {
        network: 'ETH',
        symbol: 'SAND'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-SAND-0x3845badAde8e6dFF049820680d1F14bD3903a5d0',
    symbol: 'SAND',
    support: 'ETHEREUM',
    services: [
      'transak',
      'banxa'
    ]
  },
  'ethereum-ERC20-UNI-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'UNI'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-UNI-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    symbol: 'UNI',
    support: 'ETHEREUM',
    services: [
      'transak'
    ]
  },
  'arbitrum_one-ERC20-USDC-0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'arbitrum',
        symbol: 'USDC'
      }
    },
    network: 'arbitrum_one',
    slug: 'arbitrum_one-ERC20-USDC-0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    symbol: 'USDC',
    support: 'ETHEREUM',
    services: [
      'transak'
    ]
  },
  'binance-ERC20-USDC-0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'bsc',
        symbol: 'USDC'
      }
    },
    network: 'binance',
    slug: 'binance-ERC20-USDC-0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    symbol: 'USDC',
    support: 'ETHEREUM',
    services: [
      'transak'
    ]
  },
  'ethereum-ERC20-USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'USDC'
      },
      banxa: {
        network: 'ETH',
        symbol: 'USDC'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    support: 'ETHEREUM',
    services: [
      'transak',
      'banxa'
    ]
  },
  'optimism-ERC20-USDC-0x7F5c764cBc14f9669B88837ca1490cCa17c31607': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'optimism',
        symbol: 'USDC'
      }
    },
    network: 'optimism',
    slug: 'optimism-ERC20-USDC-0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    symbol: 'USDC',
    support: 'ETHEREUM',
    services: [
      'transak'
    ]
  },
  'polygon-ERC20-USDC-0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'polygon',
        symbol: 'USDC'
      }
    },
    network: 'polygon',
    slug: 'polygon-ERC20-USDC-0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    symbol: 'USDC',
    support: 'ETHEREUM',
    services: [
      'transak'
    ]
  },
  'binance-ERC20-USDT-0x55d398326f99059fF775485246999027B3197955': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'bsc',
        symbol: 'USDT'
      }
    },
    network: 'binance',
    slug: 'binance-ERC20-USDT-0x55d398326f99059fF775485246999027B3197955',
    symbol: 'USDT',
    support: 'ETHEREUM',
    services: [
      'transak'
    ]
  },
  'ethereum-ERC20-USDT-0xdAC17F958D2ee523a2206206994597C13D831ec7': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'USDT'
      },
      banxa: {
        network: 'ETH',
        symbol: 'USDT'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-USDT-0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    support: 'ETHEREUM',
    services: [
      'transak',
      'banxa'
    ]
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
    services: [
      'transak'
    ]
  },
  'ethereum-ERC20-VERSE-0x249cA82617eC3DfB2589c4c17ab7EC9765350a18': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'VERSE'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-VERSE-0x249cA82617eC3DfB2589c4c17ab7EC9765350a18',
    symbol: 'VERSE',
    support: 'ETHEREUM',
    services: [
      'transak'
    ]
  },
  'ethereum-ERC20-WBTC-0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': {
    serviceInfo: {
      ...DEFAULT_SERVICE_INFO,
      transak: {
        network: 'ethereum',
        symbol: 'WBTC'
      },
      coinbase: {
        network: 'ethereum',
        symbol: 'WBTC'
      }
    },
    network: 'ethereum',
    slug: 'ethereum-ERC20-WBTC-0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    symbol: 'WBTC',
    support: 'ETHEREUM',
    services: [
      'transak',
      'coinbase'
    ]
  }
};

export const LIST_PREDEFINED_BUY_TOKEN = Object.values(MAP_PREDEFINED_BUY_TOKEN);
