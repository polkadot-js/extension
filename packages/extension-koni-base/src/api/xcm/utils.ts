// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CrossChainRelation } from '@subwallet/extension-base/background/KoniTypes';

export const SupportedCrossChainsMap: Record<string, CrossChainRelation> = {
  // karura_testnet: {
  //   type: 'p',
  //   relationMap: {
  //     moonbase: {
  //       type: 'p',
  //       supportedToken: ['KAR']
  //     }
  //   }
  // },
  // interlay: {
  //   type: 'p',
  //   relationMap: {
  //     moonbeam: {
  //       type: 'p',
  //       supportedToken: ['KAR']
  //     }
  //   }
  // },
  acala: {
    type: 'p',
    relationMap: {
      moonbeam: {
        type: 'p',
        supportedToken: ['ACA', 'AUSD', 'LDOT']
      }
    }
  },
  moonbeam: {
    type: 'p',
    relationMap: {
      acala: {
        type: 'p',
        supportedToken: ['xcACA', 'xcaUSD']
      },
      polkadot: {
        type: 'r',
        supportedToken: ['xcDOT']
      }
    }
  },
  moonriver: {
    type: 'p',
    relationMap: {
      kusama: {
        type: 'r',
        supportedToken: ['xcKSM']
      },
      bifrost: {
        type: 'p',
        supportedToken: ['xcBNC']
      }
    }
  },
  polkadot: {
    type: 'r',
    relationMap: {
      astar: {
        type: 'p',
        supportedToken: ['DOT']
      },
      moonbeam: {
        type: 'p',
        supportedToken: ['DOT']
      }
    }
  },
  kusama: {
    type: 'p',
    relationMap: {
      moonriver: {
        type: 'p',
        supportedToken: ['KSM']
      }
    }
  },
  astar: {
    type: 'p',
    relationMap: {
      polkadot: {
        type: 'r',
        supportedToken: ['DOT']
      }
    }
  },
  karura: {
    type: 'p',
    relationMap: {
      moonriver: {
        type: 'p',
        supportedToken: ['KAR', 'AUSD', 'LKSM', 'PHA', 'KINT', 'VSKSM', 'KSM', 'KBTC']
      }
    }
  },
  kintsugi: {
    type: 'p',
    relationMap: {
      moonriver: {
        type: 'p',
        supportedToken: ['KINT']
      }
    }
  },
  bifrost: {
    type: 'p',
    relationMap: {
      moonriver: {
        type: 'p',
        supportedToken: ['BNC']
      }
    }
  }
  // acala_testnet: {
  //   type: 'p',
  //   relationMap: {
  //     moonbase: {
  //       type: 'p',
  //       supportedToken: ['ACA', 'AUSD']
  //     }
  //   }
  // }
};

export const FOUR_INSTRUCTIONS_WEIGHT = 4000000000;

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const xTokenMoonbeamContract = require('./Xtokens.json');
