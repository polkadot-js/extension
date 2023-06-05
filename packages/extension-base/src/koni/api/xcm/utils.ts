// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { _getSubstrateParaId, _getXcmAssetMultilocation, _isChainEvmCompatible, _isNativeToken, _isSubstrateParaChain } from '@subwallet/extension-base/services/chain-service/utils';

import { decodeAddress, evmToAddress } from '@polkadot/util-crypto';

export const FOUR_INSTRUCTIONS_WEIGHT = 5000000000;
export const FOUR_INSTRUCTIONS_LIMITED_WEIGHT = { Limited: 5000000000 };

// get multilocation for destination chain from a parachain

export function getReceiverLocation (destinationChainInfo: _ChainInfo, toAddress: string, version?: string): Record<string, any> {
  const network = version && version === 'V3' ? undefined : 'Any';

  if (destinationChainInfo.slug === COMMON_CHAIN_SLUGS.ASTAR_EVM) {
    const ss58Address = evmToAddress(toAddress, 2006); // TODO: shouldn't pass addressPrefix directly

    return { AccountId32: { network, id: decodeAddress(ss58Address) } };
  }

  if (_isChainEvmCompatible(destinationChainInfo)) {
    return { AccountKey20: { network, key: toAddress } };
  }

  return { AccountId32: { network, id: decodeAddress(toAddress) } };
}

export function getBeneficiary (destinationChainInfo: _ChainInfo, recipientAddress: string, version = 'V1') {
  const receiverLocation: Record<string, any> = getReceiverLocation(destinationChainInfo, recipientAddress, version);

  return {
    [version]: {
      parents: 0,
      interior: {
        X1: receiverLocation
      }
    }
  };
}

export function getDestWeight () {
  return 'Unlimited';
}

export function getTokenLocation (tokenInfo: _ChainAsset, sendingValue: string, version = 'V1') {
  if (!_isNativeToken(tokenInfo)) {
    const multilocation = _getXcmAssetMultilocation(tokenInfo);

    return {
      [version]: [
        {
          id: multilocation,
          fun: { Fungible: sendingValue }
        }
      ]
    };
  }

  return {
    [version]: [
      {
        id: { Concrete: { parents: 0, interior: 'Here' } },
        fun: { Fungible: sendingValue }
      }
    ]
  };
}

export function getDestMultilocation (destinationChainInfo: _ChainInfo, recipient: string, version = 'V1') {
  const receiverLocation = getReceiverLocation(destinationChainInfo, recipient, version);

  if (_isSubstrateParaChain(destinationChainInfo)) {
    const interior = {
      X2: [
        { Parachain: _getSubstrateParaId(destinationChainInfo) },
        receiverLocation
      ]
    };

    return {
      [version]: {
        parents: 1,
        interior
      }
    };
  }

  return {
    [version]: {
      parents: 1,
      interior: {
        X1: receiverLocation
      }
    }
  };
}

export function getDestinationChainLocation (destinationChainInfo: _ChainInfo, version = 'V1') {
  if (_isSubstrateParaChain(destinationChainInfo)) {
    return {
      [version]: {
        parents: 1,
        interior: {
          X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
        }
      }
    };
  }

  return {
    [version]: {
      parents: 1,
      interior: 'Here'
    }
  };
}
