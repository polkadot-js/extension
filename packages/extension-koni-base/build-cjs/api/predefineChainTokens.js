"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PREDEFINE_TOKEN_DATA_MAP = void 0;
// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
const PREDEFINE_TOKEN_DATA_MAP = {
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
      specialOption: {
        LiquidCrowdloan: 13
      }
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
  }
};
exports.PREDEFINE_TOKEN_DATA_MAP = PREDEFINE_TOKEN_DATA_MAP;