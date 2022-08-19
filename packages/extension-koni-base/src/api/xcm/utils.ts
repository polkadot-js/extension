// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CrossChainRelation, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';

import { decodeAddress, evmToAddress } from '@polkadot/util-crypto';

export const SupportedCrossChainsMap: Record<string, CrossChainRelation> = {
  polkadot: {
    type: 'r',
    isEthereum: false,
    relationMap: {
      moonbeam: {
        type: 'p',
        isEthereum: true,
        supportedToken: ['DOT']
      },
      astar: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['DOT']
      },
      acala: {
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
      },
      shiden: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['KSM']
      },
      karura: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['KSM']
      },
      bifrost: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['KSM']
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
        supportedToken: ['ACA', 'aUSD']
      },
      astar: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['aUSD']
      },
      astarEvm: {
        type: 'p',
        isEthereum: true,
        supportedToken: ['aUSD']
      },
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
        supportedToken: ['KAR', 'aUSD']
      },
      shiden: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['aUSD']
      },
      shidenEvm: {
        type: 'p',
        isEthereum: true,
        supportedToken: ['aUSD']
      },
      kusama: {
        type: 'r',
        isEthereum: false,
        supportedToken: ['KSM']
      },
      bifrost: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['aUSD', 'BNC', 'KAR']
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
        supportedToken: ['xcaUSD']
      },
      interlay: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['xcINTR', 'xcIBTC']
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
      karura: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['xcAUSD']
      },
      kintsugi: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['xcKINT', 'xcKBTC']
      },
      kusama: {
        type: 'r',
        isEthereum: false,
        supportedToken: ['xcKSM']
      },
      bifrost: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['xcBNC']
      }
    }
  },
  astar: {
    type: 'p',
    isEthereum: false,
    relationMap: {
      acala: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['aUSD']
      },
      polkadot: {
        type: 'r',
        isEthereum: false,
        supportedToken: ['DOT']
      }
    }
  },
  shiden: {
    type: 'p',
    isEthereum: false,
    relationMap: {
      karura: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['aUSD']
      },
      kusama: {
        type: 'r',
        isEthereum: false,
        supportedToken: ['KSM']
      }
    }
  },
  interlay: {
    type: 'p',
    isEthereum: false,
    relationMap: {
      moonbeam: {
        type: 'p',
        isEthereum: true,
        supportedToken: ['INTR', 'IBTC']
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
        supportedToken: ['KINT', 'KBTC']
      }
    }
  },
  bifrost: { // bifrost on kusama
    type: 'p',
    isEthereum: false,
    relationMap: {
      moonriver: {
        type: 'p',
        isEthereum: true,
        supportedToken: ['BNC']
      },
      karura: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['aUSD', 'KAR', 'BNC']
      },
      kusama: {
        type: 'r',
        isEthereum: false,
        supportedToken: ['KSM']
      }
    }
  }
  // moonbase: {
  //   isEthereum: true,
  //   type: 'p',
  //   relationMap: {
  //     acala_dev: {
  //       type: 'p',
  //       isEthereum: false,
  //       supportedToken: ['xcKAR']
  //     },
  //     moonbase_relay: {
  //       type: 'r',
  //       isEthereum: false,
  //       supportedToken: ['xcUNIT']
  //     },
  //     bifrost_testnet: {
  //       type: 'r',
  //       isEthereum: false,
  //       supportedToken: ['xcBNC']
  //     }
  //   }
  // },
  // rococo: {
  //   isEthereum: false,
  //   type: 'r',
  //   relationMap: {
  //     contractsRococo: {
  //       type: 'p',
  //       isEthereum: false,
  //       supportedToken: ['ROC']
  //     }
  //   }
  // }
  // moonbase_relay: {
  //   isEthereum: false,
  //   type: 'r',
  //   relationMap: {
  //     moonbase: {
  //       type: 'p',
  //       isEthereum: true,
  //       supportedToken: ['Unit']
  //     }
  //   }
  // },
  // acala_testnet: {
  //   type: 'p',
  //   isEthereum: false,
  //   relationMap: {
  //     moonbase: {
  //       type: 'p',
  //       isEthereum: true,
  //       supportedToken: ['ACA', 'AUSD']
  //     }
  //   }
  // }
  // karura_testnet: {
  //   type: 'p',
  //   isEthereum: false,
  //   relationMap: {
  //     moonbase: {
  //       type: 'p',
  //       isEthereum: true,
  //       supportedToken: ['KAR']
  //     }
  //   }
  // }
};

export const FOUR_INSTRUCTIONS_WEIGHT = 5000000000;

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const xTokenMoonbeamContract = require('./Xtokens.json');

// get multilocation for destination chain from a parachain
export function getMultiLocationFromParachain (originChain: string, destinationChain: string, networkMap: Record<string, NetworkJson>, toAddress: string) {
  const xcmType = SupportedCrossChainsMap[originChain].type + SupportedCrossChainsMap[originChain].relationMap[destinationChain].type;
  const paraId = networkMap[destinationChain].paraId as number;

  if (xcmType === 'pp') { // parachain -> parachain
    let ss58Address = toAddress;

    if (destinationChain === 'astarEvm' || destinationChain === 'shidenEvm') {
      ss58Address = evmToAddress(toAddress, networkMap[destinationChain].ss58Format);
    }

    let interior: Record<string, any> = {
      X2: [
        { Parachain: paraId },
        { AccountId32: { network: 'Any', id: decodeAddress(ss58Address) } }
      ]
    };

    if (SupportedCrossChainsMap[originChain].relationMap[destinationChain].isEthereum && destinationChain !== 'astarEvm' && destinationChain !== 'shidenEvm') {
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
