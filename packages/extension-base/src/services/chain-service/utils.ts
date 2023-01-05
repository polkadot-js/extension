// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {_ChainAsset, _ChainInfo} from '@subwallet/chain/types';
import { _CUSTOM_NETWORK_PREFIX } from '@subwallet/extension-base/services/chain-service/types';

import { isEthereumAddress } from '@polkadot/util-crypto';

export function _isCustomNetwork (slug: string) {
  if (slug.length === 0) {
    return true;
  }

  return slug.startsWith(_CUSTOM_NETWORK_PREFIX);
}

export function _isCustomAsset (slug: string) { // might be different from _isCustomNetwork
  if (slug.length === 0) {
    return true;
  }

  return slug.startsWith(_CUSTOM_NETWORK_PREFIX);
}

export function _getCustomAssets (assetRegistry: Record<string, _ChainAsset>): Record<string, _ChainAsset> {
  const filteredAssetMap: Record<string, _ChainAsset> = {};

  Object.values(assetRegistry).forEach((chainAsset) => {
    if (_isCustomAsset(chainAsset.slug)) {
      filteredAssetMap[chainAsset.slug] = chainAsset;
    }
  });

  return filteredAssetMap;
}

export function _isEqualContractAddress (address1: string, address2: string) {
  if (isEthereumAddress(address1) && isEthereumAddress(address2)) {
    return address1.toLowerCase() === address2.toLowerCase(); // EVM address is case-insensitive
  }

  return address2 === address1;
}

export function _isEqualSmartContractAsset (asset1: _ChainAsset, asset2: _ChainAsset) {
  const contract1 = asset1.metadata?.contractAddress as string || undefined || null;
  const contract2 = asset2.metadata?.contractAddress as string || undefined || null;

  if (!contract1 || !contract2) {
    return false;
  }

  if (_isEqualContractAddress(contract1, contract2) && asset1.assetType === asset2.assetType && asset1.originChain === asset2.originChain) {
    return true;
  }

  return false;
}

export function _isPureEvmChain (chainInfo: _ChainInfo) {
  return (chainInfo.evmInfo !== null && chainInfo.substrateInfo === null);
}

export function getContractAddressOf
