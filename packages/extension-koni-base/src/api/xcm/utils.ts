// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CrossChainRelation, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';

import { decodeAddress } from '@polkadot/util-crypto';

export const SupportedCrossChainsMap: Record<string, CrossChainRelation> = {
  moonbase_relay: {
    isEthereum: false,
    type: 'r',
    relationMap: {
      moonbase: {
        type: 'p',
        isEthereum: true,
        supportedToken: ['Unit']
      }
    }
  },
  acala: {
    type: 'p',
    isEthereum: false,
    relationMap: {
      moonbeam: {
        type: 'p',
        isEthereum: true,
        supportedToken: ['ACA', 'AUSD', 'LDOT']
      }
    }
  },
  moonbeam: {
    type: 'p',
    isEthereum: true,
    relationMap: {
      acala: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['xcACA', 'xcaUSD']
      },
      polkadot: {
        type: 'r',
        isEthereum: false,
        supportedToken: ['xcDOT']
      }
    }
  },
  moonriver: {
    type: 'p',
    isEthereum: true,
    relationMap: {
      kusama: {
        type: 'r',
        isEthereum: false,
        supportedToken: ['xcKSM']
      },
      bifrost: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['xcBNC']
      },
      kintsugi: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['xcKINT', 'xckBTC']
      },
      karura: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['xcKAR', 'xcaUSD']
      },
      statemine: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['xcRMRK', 'xcUSDT']
      },
      khala: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['xcPHA']
      }
    }
  },
  polkadot: {
    type: 'r',
    isEthereum: false,
    relationMap: {
      astar: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['DOT']
      },
      moonbeam: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['DOT']
      }
    }
  },
  kusama: {
    type: 'r',
    isEthereum: false,
    relationMap: {
      moonriver: {
        type: 'p',
        isEthereum: true,
        supportedToken: ['KSM']
      }
    }
  },
  astar: {
    type: 'p',
    isEthereum: false,
    relationMap: {
      polkadot: {
        type: 'r',
        isEthereum: false,
        supportedToken: ['DOT']
      }
    }
  },
  karura: {
    type: 'p',
    isEthereum: false,
    relationMap: {
      moonriver: {
        type: 'p',
        isEthereum: true,
        supportedToken: ['KAR', 'AUSD', 'LKSM', 'PHA', 'KINT', 'VSKSM', 'KSM', 'KBTC']
      }
    }
  },
  kintsugi: {
    type: 'p',
    isEthereum: false,
    relationMap: {
      moonriver: {
        type: 'p',
        isEthereum: true,
        supportedToken: ['KINT']
      }
    }
  },
  bifrost: {
    type: 'p',
    isEthereum: false,
    relationMap: {
      moonriver: {
        type: 'p',
        isEthereum: true,
        supportedToken: ['BNC']
      }
    }
  },
  moonbase: {
    isEthereum: true,
    type: 'p',
    relationMap: {
      acala_dev: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['xcKAR']
      },
      moonbase_relay: {
        type: 'r',
        isEthereum: false,
        supportedToken: ['xcUNIT']
      },
      bifrost_testnet: {
        type: 'r',
        isEthereum: false,
        supportedToken: ['xcBNC']
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
  // },
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
};

export const FOUR_INSTRUCTIONS_WEIGHT = 4000000000;

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const xTokenMoonbeamContract = require('./Xtokens.json');

// get multilocation for destination chain from a parachain
export function getMultiLocationFromParachain (originChain: string, destinationChain: string, networkMap: Record<string, NetworkJson>, toAddress: string) {
  const xcmType = SupportedCrossChainsMap[originChain].type + SupportedCrossChainsMap[originChain].relationMap[destinationChain].type;
  const paraId = networkMap[destinationChain].paraId as number;

  if (xcmType === 'pp') { // parachain -> parachain
    let interior: Record<string, any> = {
      X2: [
        { Parachain: paraId },
        { AccountId32: { network: 'Any', id: decodeAddress(toAddress) } }
      ]
    };

    if (SupportedCrossChainsMap[originChain].relationMap[destinationChain].isEthereum) {
      interior = {
        X2: [
          { Parachain: paraId },
          { AccountKey20: { network: 'Any', key: toAddress } }
        ]
      };
    }

    return { V1: { parents: 1, interior } };
  }

  // parachain -> relaychain by default
  return {
    V1: {
      parents: 1,
      interior: {
        X1: { AccountId32: { network: 'Any', id: decodeAddress(toAddress) } }
      }
    }
  };
}
