// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenInfo } from '@polkadot/extension-base/background/KoniTypes';

export const PREDEFINE_TOKEN_DATA_MAP: Record<string, Record<string, TokenInfo>> = {
  acala: {
    AUSD: {
      isMainToken: false,
      symbol: 'aUSD',
      name: 'aUSD',
      decimals: 12
    },
    DOT: {
      isMainToken: false,
      symbol: 'DOT',
      name: 'DOT',
      decimals: 10
    },
    LDOT: {
      isMainToken: false,
      symbol: 'LDOT',
      name: 'LDOT',
      decimals: 10
    },
    LCDOT: {
      isMainToken: false,
      symbol: 'LCDOT',
      name: 'LCDOT',
      decimals: 10,
      specialOption: { LiquidCrowdloan: 13 }
    }
  },
  karura: {
    KUSD: {
      isMainToken: false,
      symbol: 'KUSD',
      name: 'KUSD',
      decimals: 12
    },
    KSM: {
      isMainToken: false,
      symbol: 'KSM',
      name: 'KSM',
      decimals: 12
    },
    LKSM: {
      isMainToken: false,
      symbol: 'LKSM',
      name: 'LKSM',
      decimals: 12
    },
    BNC: {
      isMainToken: false,
      symbol: 'BNC',
      name: 'BNC',
      decimals: 12
    },
    VSKSM: {
      isMainToken: false,
      symbol: 'VSKSM',
      name: 'VSKSM',
      decimals: 12
    },
    PHA: {
      isMainToken: false,
      symbol: 'PHA',
      name: 'PHA',
      decimals: 12
    },
    KINT: {
      isMainToken: false,
      symbol: 'KINT',
      name: 'KINT',
      decimals: 12
    },
    KBTC: {
      isMainToken: false,
      symbol: 'KBTC',
      name: 'KBTC',
      decimals: 8
    },
    TAI: {
      isMainToken: false,
      symbol: 'TAI',
      name: 'TAI',
      decimals: 12
    }
  },
  bifrost: {
    KUSD: {
      isMainToken: false,
      symbol: 'KUSD',
      name: 'KUSD',
      decimals: 12
    },
    DOT: {
      isMainToken: false,
      symbol: 'DOT',
      name: 'DOT',
      decimals: 10
    },
    KSM: {
      isMainToken: false,
      symbol: 'KSM',
      name: 'KSM',
      decimals: 12
    },
    KAR: {
      isMainToken: false,
      symbol: 'KAR',
      name: 'KAR',
      decimals: 12
    },
    ZLK: {
      isMainToken: false,
      symbol: 'ZLK',
      name: 'ZLK',
      decimals: 18
    },
    PHA: {
      isMainToken: false,
      symbol: 'PHA',
      name: 'PHA',
      decimals: 12
    },
    RMRK: {
      isMainToken: false,
      symbol: 'RMRK',
      name: 'RMRK',
      decimals: 10
    }
  },
  moonbase: {
    xcBNC: {
      isMainToken: false,
      symbol: 'xcBNC',
      erc20Address: '0xFFFFFFFF1FAE104DC4C134306BCA8E2E1990ACFD',
      decimals: 12,
      name: 'xcBNC'
    },
    xcUNIT: {
      isMainToken: false,
      symbol: 'xcUNIT',
      erc20Address: '0xFFFFFFFF1FCACBD218EDC0EBA20FC2308C778080',
      decimals: 12,
      name: 'xcUNIT'
    },
    xcKAR: {
      isMainToken: false,
      symbol: 'xcKAR',
      erc20Address: '0xFFFFFFFF08220AD2E6E157F26ED8BD22A336A0A5',
      decimals: 12,
      name: 'xcKarura'
    },
    XCKINT: {
      isMainToken: false,
      symbol: 'XCKINT',
      erc20Address: '0xFFFFFFFF27C019790DFBEE7CB70F5996671B2882',
      decimals: 12,
      name: 'xcKintsugi'
    }
  },
  moonriver: {
    xcKBTC: {
      isMainToken: false,
      symbol: 'xcKBTC',
      erc20Address: '0xFFFFFFFFF6E528AD57184579BEEE00C5D5E646F0',
      decimals: 8,
      name: 'Kintsugi Wrapped BTC'
    },
    xcKINT: {
      isMainToken: false,
      symbol: 'xcKINT',
      erc20Address: '0xFFFFFFFF83F4F317D3CBF6EC6250AEC3697B3FF2',
      decimals: 12,
      name: 'Kintsugi Native Token'
    },
    xcRMRK: {
      isMainToken: false,
      symbol: 'xcRMRK',
      erc20Address: '0xFFFFFFFF893264794D9D57E1E0E21E0042AF5A0A',
      decimals: 10,
      name: 'xcRMRK'
    },
    xcKSM: {
      isMainToken: false,
      symbol: 'xcKSM',
      erc20Address: '0xFFFFFFFF1FCACBD218EDC0EBA20FC2308C778080',
      decimals: 12,
      name: 'xcKSM'
    },
    xcKAR: {
      isMainToken: false,
      symbol: 'xcKAR',
      erc20Address: '0xFFFFFFFF08220AD2E6E157F26ED8BD22A336A0A5',
      decimals: 12,
      name: 'Karura'
    },
    xcBNC: {
      isMainToken: false,
      symbol: 'xcBNC',
      erc20Address: '0xFFFFFFFFF075423BE54811ECB478E911F22DDE7D',
      decimals: 12,
      name: 'xcBNC'
    }
  },
  astarEvm: {
    ARSW: {
      isMainToken: false,
      symbol: 'ARSW',
      erc20Address: '0xde2578edec4669ba7f41c5d5d2386300bcea4678',
      decimals: 18,
      name: 'ArthSwap Token'
    },
    BNB: {
      isMainToken: false,
      symbol: 'BNB',
      erc20Address: '0x7f27352D5F83Db87a5A3E00f4B07Cc2138D8ee52',
      decimals: 18,
      name: 'Binance Coin'
    },
    BUSD: {
      isMainToken: false,
      symbol: 'BUSD',
      erc20Address: '0x4Bf769b05E832FCdc9053fFFBC78Ca889aCb5E1E',
      decimals: 18,
      name: 'Binance USD'
    },
    CRV: {
      isMainToken: false,
      symbol: 'CRV',
      erc20Address: '0x7756a83563f0f56937A6FdF668E7D9F387c0D199',
      decimals: 18,
      name: 'Curve DAO Token'
    },
    DAI: {
      isMainToken: false,
      symbol: 'DAI',
      erc20Address: '0x6De33698e9e9b787e09d3Bd7771ef63557E148bb',
      decimals: 18,
      name: 'Dai Stablecoin'
    },
    PKEX: {
      isMainToken: false,
      symbol: 'PKEX',
      erc20Address: '0x1fE622E91e54D6AD00B01917351Ea6081426764A',
      decimals: 18,
      name: 'PolkaEx'
    },
    SDN: {
      isMainToken: false,
      symbol: 'SDN',
      erc20Address: '0x1fE622E91e54D6AD00B01917351Ea6081426764A',
      decimals: 18,
      name: 'Shiden Network'
    },
    USDC: {
      isMainToken: false,
      symbol: 'USDC',
      erc20Address: '0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98',
      decimals: 6,
      name: 'USD Coin'
    },
    USDT: {
      isMainToken: false,
      symbol: 'USDT',
      erc20Address: '0x3795C36e7D12A8c252A20C5a7B455f7c57b60283',
      decimals: 6,
      name: 'Tether USD (USDT)'
    },
    WBTC: {
      isMainToken: false,
      symbol: 'WBTC',
      erc20Address: '0xad543f18cff85c77e140e3e5e3c3392f6ba9d5ca',
      decimals: 8,
      name: 'Wrapped BTC'
    },
    WETH: {
      isMainToken: false,
      symbol: 'WETH',
      erc20Address: '0x81ECac0D6Be0550A00FF064a4f9dd2400585FE9c',
      decimals: 18,
      name: 'Wrapped Ether'
    },
    KZY: {
      isMainToken: false,
      symbol: 'KZY',
      erc20Address: '0x3d4DCFD2B483549527f7611ccFecb40b47d0c17b',
      decimals: 18,
      name: 'Kazuya Token'
    },
    WASTR: {
      isMainToken: false,
      symbol: 'WASTR',
      erc20Address: '0xAeaaf0e2c81Af264101B9129C00F4440cCF0F720',
      decimals: 18,
      name: 'Wrapped Astar'
    },
    'ARSW-LP': {
      isMainToken: false,
      symbol: 'ARSW-LP',
      erc20Address: '0x87988EbDE7E661F44eB3a586C5E0cEAB533a2d9C',
      decimals: 18,
      name: 'Arthswap LPs (ARSW-LP)'
    },
    KOS: {
      isMainToken: false,
      symbol: 'KOS',
      erc20Address: '0xbcF7aa4fC081f5670d9b8a1BdD1cFd98DCAeE6e6',
      decimals: 18,
      name: 'KaioShin Token'
    },
    PPC: {
      isMainToken: false,
      symbol: 'PPC',
      erc20Address: '0x34F79636a55d9961E47b7784eF460B021B499406',
      decimals: 18,
      name: 'Pepe Coin'
    }
  }
};