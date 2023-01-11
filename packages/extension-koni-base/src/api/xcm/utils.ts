// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain/types';
import { CrossChainRelation } from '@subwallet/extension-base/background/KoniTypes';
import { _XCM_CHAIN_GROUP, _XCM_TYPE } from '@subwallet/extension-base/services/chain-service/constants';
import { _getChainSubstrateAddressPrefix, _getSubstrateParaId, _getXcmTransferType, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';

import { decodeAddress, evmToAddress } from '@polkadot/util-crypto';

// TODO: remove this
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
      },
      statemint: {
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
  statemint: {
    type: 'p',
    isEthereum: false,
    relationMap: {
      moonbeam: {
        type: 'p',
        isEthereum: true,
        supportedToken: ['USDt']
      },
      astar: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['USDt']
      },
      astarEvm: {
        type: 'p',
        isEthereum: true,
        supportedToken: ['USDt']
      },
      polkadot: {
        type: 'r',
        isEthereum: false,
        supportedToken: ['DOT']
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
        supportedToken: ['ACA', 'aUSD', 'GLMR']
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
      },
      pioneer: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['NEER']
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
        supportedToken: ['xcINTR', 'xciBTC']
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
        supportedToken: ['xcKINT', 'xckBTC']
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
        supportedToken: ['INTR', 'iBTC']
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
        supportedToken: ['KINT', 'kBTC']
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
  },
  pioneer: {
    type: 'p',
    isEthereum: false,
    relationMap: {
      karura: {
        type: 'p',
        isEthereum: false,
        supportedToken: ['NEER']
      }
    }
  }
};

export const FOUR_INSTRUCTIONS_WEIGHT = 5000000000;
export const POLKADOT_LIMITED_WEIGHT = 1000000000;
export const POLKADOT_UNLIMITED_WEIGHT = 'Unlimited';

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const xTokenMoonbeamContract = require('./Xtokens.json');

// get multilocation for destination chain from a parachain
export function getMultiLocationFromParachain (originChain: string, destinationChain: string, chainInfoMap: Record<string, _ChainInfo>, toAddress: string) {
  const xcmType = _getXcmTransferType(chainInfoMap[originChain], chainInfoMap[destinationChain]);
  const paraId = _getSubstrateParaId(chainInfoMap[destinationChain]);
  const receiverLocation = getReceiverLocation(originChain, destinationChain, chainInfoMap, toAddress);

  if (xcmType === _XCM_TYPE.PP) { // parachain -> parachain
    const interior: Record<string, any> = {
      X2: [
        { Parachain: paraId },
        receiverLocation
      ]
    };

    return { V1: { parents: 1, interior } };
  }

  // parachain -> relaychain by default
  return {
    V1: {
      parents: 1,
      interior: {
        X1: receiverLocation
      }
    }
  };
}

export function getReceiverLocation (originChain: string, destinationChain: string, chainInfoMap: Record<string, _ChainInfo>, toAddress: string): Record<string, any> {
  if (_XCM_CHAIN_GROUP.astarEvm.includes(destinationChain)) {
    const ss58Address = evmToAddress(toAddress, _getChainSubstrateAddressPrefix(chainInfoMap[destinationChain]));

    return { AccountId32: { network: 'Any', id: decodeAddress(ss58Address) } };
  }

  if (_isChainEvmCompatible(chainInfoMap[destinationChain])) {
    return { AccountKey20: { network: 'Any', key: toAddress } };
  }

  return { AccountId32: { network: 'Any', id: decodeAddress(toAddress) } };
}
