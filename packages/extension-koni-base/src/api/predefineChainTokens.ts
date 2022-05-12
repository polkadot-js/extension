// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenInfo } from '@subwallet/extension-base/background/KoniTypes';

export const PREDEFINE_TOKEN_DATA_MAP: Record<string, Record<string, TokenInfo>> = {
  statemine: {
    USDT: {
      isMainToken: false,
      assetIndex: 11,
      symbol: 'USDT',
      name: 'USDT',
      decimals: 4
    },
    USDC: {
      isMainToken: false,
      assetIndex: 10,
      symbol: 'USDC',
      name: 'USDC',
      decimals: 4
    },
    RMRK: {
      isMainToken: false,
      assetIndex: 8,
      symbol: 'RMRK',
      name: 'RMRK.app',
      decimals: 10
    },
    ARIS: {
      isMainToken: false,
      assetIndex: 16,
      symbol: 'ARIS',
      name: 'PolarisDAO',
      decimals: 8
    },
    BILL: {
      isMainToken: false,
      assetIndex: 223,
      symbol: 'BILL',
      name: 'BILLCOIN',
      decimals: 8
    },
    CHAOS: {
      isMainToken: false,
      assetIndex: 69420,
      symbol: 'CHAOS',
      name: 'Chaos',
      decimals: 10
    },
    CHRWNA: {
      isMainToken: false,
      assetIndex: 567,
      symbol: 'CHRWNA',
      name: 'Chrawnna Coin',
      decimals: 10
    },
    BAILEGO: {
      isMainToken: false,
      assetIndex: 88888,
      symbol: 'BAILEGO',
      name: 'SHIBATALES',
      decimals: 0
    }
  },
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
    MFG: {
      isMainToken: false,
      symbol: 'MFG',
      erc20Address: '0xb161B2DA48DE283ec22BaFbC36E5551c892629A2',
      decimals: 18,
      name: 'MFG'
    },
    MFR: {
      isMainToken: false,
      symbol: 'MFR',
      erc20Address: '0xd7D798825F4e0BC340F6eE38282f2a0455226A87',
      decimals: 18,
      name: 'MFR'
    },
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
    USDT: {
      isMainToken: false,
      symbol: 'USDT',
      erc20Address: '0xB44a9B6905aF7c801311e8F4E76932ee959c663C',
      decimals: 6,
      name: 'Tether USD'
    },
    USDC: {
      isMainToken: false,
      symbol: 'USDC',
      erc20Address: '0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D',
      decimals: 6,
      name: 'USD Coin'
    },
    DAI: {
      isMainToken: false,
      symbol: 'DAI',
      erc20Address: '0x80A16016cC4A2E6a2CACA8a4a498b1699fF0f844',
      decimals: 18,
      name: 'Dai Stablecoin'
    },
    MFAM: {
      isMainToken: false,
      symbol: 'MFAM',
      erc20Address: '0xBb8d88bcD9749636BC4D2bE22aaC4Bb3B01A58F1',
      decimals: 18,
      name: 'MFAM'
    },
    ZLK: {
      isMainToken: false,
      symbol: 'ZLK',
      erc20Address: '0x0f47ba9d9Bde3442b42175e51d6A367928A1173B',
      decimals: 18,
      name: 'Zenlink Network'
    },
    SOLAR: {
      isMainToken: false,
      symbol: 'SOLAR',
      erc20Address: '0x6bD193Ee6D2104F14F94E2cA6efefae561A4334B',
      decimals: 18,
      name: 'SolarBeam'
    },
    FRAX: {
      isMainToken: false,
      symbol: 'FRAX',
      erc20Address: '0x1A93B23281CC1CDE4C4741353F3064709A16197d',
      decimals: 18,
      name: 'SolarBeam'
    },
    FXS: {
      isMainToken: false,
      symbol: 'FXS',
      erc20Address: '0x6f1D1Ee50846Fcbc3de91723E61cb68CFa6D0E98',
      decimals: 18,
      name: 'Frax Share'
    },
    CWS: {
      isMainToken: false,
      symbol: 'CWS',
      erc20Address: '0x6fc9651f45B262AE6338a701D563Ab118B1eC0Ce',
      decimals: 18,
      name: 'Crowns'
    },
    RIB: {
      isMainToken: false,
      symbol: 'RIB',
      erc20Address: '0xbD90A6125a84E5C512129D622a75CDDE176aDE5E',
      decimals: 18,
      name: 'RiverBoat'
    },
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
  moonbeam: {
    USDT: {
      isMainToken: false,
      symbol: 'USDT',
      erc20Address: '0xeFAeeE334F0Fd1712f9a8cc375f427D9Cdd40d73',
      decimals: 6,
      name: 'Tether USD'
    },
    USDC: {
      isMainToken: false,
      symbol: 'USDC',
      erc20Address: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
      decimals: 6,
      name: 'USD Coin'
    },
    BNB: {
      isMainToken: false,
      symbol: 'BNB',
      erc20Address: '0xc9BAA8cfdDe8E328787E29b4B078abf2DaDc2055',
      decimals: 18,
      name: 'Binance'
    },
    GLINT: {
      isMainToken: false,
      symbol: 'GLINT',
      erc20Address: '0xcd3B51D98478D53F4515A306bE565c6EebeF1D58',
      decimals: 18,
      name: 'Beamswap'
    },
    SHARE: {
      isMainToken: false,
      symbol: 'SHARE',
      erc20Address: '0x4204cAd97732282d261FbB7088e07557810A6408',
      decimals: 18,
      name: 'Beamshare'
    },
    BEANS: {
      isMainToken: false,
      symbol: 'BEANS',
      erc20Address: '0x65b09ef8c5A096C5Fd3A80f1F7369E56eB932412',
      decimals: 18,
      name: 'MoonBeans'
    },
    STELLA: {
      isMainToken: false,
      symbol: 'STELLA',
      erc20Address: '0x0E358838ce72d5e61E0018a2ffaC4bEC5F4c88d2',
      decimals: 18,
      name: 'StellaSwap'
    },
    xStella: {
      isMainToken: false,
      symbol: 'xStella',
      erc20Address: '0x06A3b410b681c82417A906993aCeFb91bAB6A080',
      decimals: 18,
      name: 'XStella'
    },
    veSOLAR: {
      isMainToken: false,
      symbol: 'veSOLAR',
      erc20Address: '0x0DB6729C03C85B0708166cA92801BcB5CAc781fC',
      decimals: 18,
      name: 'Vested SolarBeam'
    },
    FLARE: {
      isMainToken: false,
      symbol: 'FLARE',
      erc20Address: '0xE3e43888fa7803cDC7BEA478aB327cF1A0dc11a7',
      decimals: 18,
      name: 'Flare'
    },
    CSG: {
      isMainToken: false,
      symbol: 'CSG',
      erc20Address: '0x2Dfc76901bB2ac2A5fA5fc479590A490BBB10a5F',
      decimals: 18,
      name: 'Cougar'
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
  },
  shidenEvm: {
    PKEX: {
      isMainToken: false,
      symbol: 'PKEX',
      erc20Address: '0xdc42728b0ea910349ed3c6e1c9dc06b5fb591f98',
      decimals: 18,
      name: 'PolkaEx'
    },
    BNB: {
      isMainToken: false,
      symbol: 'BNB',
      erc20Address: '0x332730a4f6e03d9c55829435f10360e13cfa41ff',
      decimals: 18,
      name: 'Binance'
    },
    BUSD: {
      isMainToken: false,
      symbol: 'BUSD',
      erc20Address: '0xdc42728b0ea910349ed3c6e1c9dc06b5fb591f98',
      decimals: 18,
      name: 'Binance-Peg BUSD Token'
    },
    JPYC: {
      isMainToken: false,
      symbol: 'JPYC',
      erc20Address: '0x735abe48e8782948a37c7765ecb76b98cde97b0f',
      decimals: 18,
      name: 'JPY Coin'
    },
    ETH: {
      isMainToken: false,
      symbol: 'ETH',
      erc20Address: '0x765277eebeca2e31912c9946eae1021199b39c61',
      decimals: 18,
      name: 'Ethereum'
    },
    USDC: {
      isMainToken: false,
      symbol: 'USDC',
      erc20Address: '0xfa9343c3897324496a05fc75abed6bac29f8a40f',
      decimals: 6,
      name: 'USD Coin'
    },
    USDT: {
      isMainToken: false,
      symbol: 'USDT',
      erc20Address: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
      decimals: 18,
      name: 'Tether USD'
    },
    WSDN: {
      isMainToken: false,
      symbol: 'WSDN',
      erc20Address: '0x0f933dc137d21ca519ae4c7e93f87a4c8ef365ef',
      decimals: 18,
      name: 'Wrapped Shiden'
    },
    Kac: {
      isMainToken: false,
      symbol: 'Kac',
      erc20Address: '0xb12c13e66ade1f72f71834f2fc5082db8c091358',
      decimals: 18,
      name: 'Kaco Token'
    },
    SHBI: {
      isMainToken: false,
      symbol: 'SHBI',
      erc20Address: '0xec0c789c6dc019b1c19f055edf938b369d235d2c',
      decimals: 18,
      name: 'SHINOBI'
    },
    SMS: {
      isMainToken: false,
      symbol: 'SMS',
      erc20Address: '0xec0c789c6dc019b1c19f055edf938b369d235d2c',
      decimals: 18,
      name: 'SafeMoonShiden'
    },
    STND: {
      isMainToken: false,
      symbol: 'STND',
      erc20Address: '0x722377A047e89CA735f09Eb7CccAb780943c4CB4',
      decimals: 18,
      name: 'Standard'
    },
    SRISE: {
      isMainToken: false,
      symbol: 'SRISE',
      erc20Address: '0x16bf7ecaf868348703ff5b5c0c3b84be7bf483f9',
      decimals: 18,
      name: 'SHIDENRISE'
    },
    FEGS: {
      isMainToken: false,
      symbol: 'FEGS',
      erc20Address: '0xa9b79AAB9d60e8e6d08D2cbAd56ff0De58ff8d41',
      decimals: 18,
      name: 'FEGSHIDEN'
    },
    KWIK: {
      isMainToken: false,
      symbol: 'KWIK',
      erc20Address: '0xa9b79AAB9d60e8e6d08D2cbAd56ff0De58ff8d41',
      decimals: 18,
      name: 'Kwikswap'
    }
  }
};
