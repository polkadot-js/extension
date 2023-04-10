// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainInfo } from '@subwallet/chain-list/types';
import { _getChainSubstrateAddressPrefix, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';

import { decodeAddress, evmToAddress } from '@polkadot/util-crypto';

export const FOUR_INSTRUCTIONS_WEIGHT = { Limited: 5000000000 };
export const POLKADOT_LIMITED_WEIGHT = 1000000000;
export const POLKADOT_UNLIMITED_WEIGHT = 'Unlimited';

// get multilocation for destination chain from a parachain

export function getReceiverLocation (originChainInfo: _ChainInfo, destinationChainInfo: _ChainInfo, toAddress: string): Record<string, any> {
  if (destinationChainInfo.slug === COMMON_CHAIN_SLUGS.ASTAR_EVM) {
    const ss58Address = evmToAddress(toAddress, 2006); // TODO: shouldn't pass addressPrefix directly

    return { AccountId32: { network: 'Any', id: decodeAddress(ss58Address) } };
  }

  if (_isChainEvmCompatible(destinationChainInfo)) {
    return { AccountKey20: { network: 'Any', key: toAddress } };
  }

  return { AccountId32: { network: 'Any', id: decodeAddress(toAddress) } };
}

export function getBeneficiary (originChainInfo: _ChainInfo, destinationChainInfo: _ChainInfo, recipientAddress: string) {
  const receiverLocation: Record<string, any> = getReceiverLocation(originChainInfo, destinationChainInfo, recipientAddress);

  return {
    V1: {
      parents: 0,
      interior: {
        X1: receiverLocation
      }
    }
  };
}

export const NETWORK_USE_UNLIMITED_WEIGHT: string[] = ['acala', 'karura', 'statemint', 'moonriver'];
