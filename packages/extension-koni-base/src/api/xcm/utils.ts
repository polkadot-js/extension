// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _XCM_CHAIN_GROUP, _XCM_TYPE } from '@subwallet/extension-base/services/chain-service/constants';
import { _getChainSubstrateAddressPrefix, _getSubstrateParaId, _getXcmTransferType, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';

import { decodeAddress, evmToAddress } from '@polkadot/util-crypto';

export const FOUR_INSTRUCTIONS_WEIGHT = 5000000000;
export const POLKADOT_LIMITED_WEIGHT = 1000000000;
export const POLKADOT_UNLIMITED_WEIGHT = 'Unlimited';

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
