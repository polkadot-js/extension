// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { _getEvmChainId, _getSubstrateGenesisHash, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';

export const getNetworkJsonByGenesisHash = (networkMap: Record<string, NetworkJson>, hash?: string | null): NetworkJson | null => {
  if (!hash) {
    return null;
  }

  for (const n in networkMap) {
    if (!Object.prototype.hasOwnProperty.call(networkMap, n)) {
      continue;
    }

    const networkInfo = networkMap[n];

    if (networkInfo.genesisHash === hash) {
      return networkInfo;
    }
  }

  return null;
};

export const findNetworkJsonByGenesisHash = (
  networkMap: Record<string, _ChainInfo>,
  hash?: string | null,
  forceEthereum?: boolean
): _ChainInfo | null => {
  if (!hash) {
    return null;
  }

  const networks = Object.values(networkMap);

  const filtered = networks.filter((network) => _getSubstrateGenesisHash(network).toLowerCase().includes(hash.toLowerCase()));

  if (filtered.length === 1) {
    return filtered[0];
  } else if (filtered.length > 1) {
    return filtered.find((network) => _isChainEvmCompatible(network) === !!forceEthereum) || null;
  }

  return null;
};

export const getNetworkKeyByGenesisHash = (networkMap: Record<string, NetworkJson>, hash?: string | null): string | null => {
  if (!hash) {
    return null;
  }

  for (const n in networkMap) {
    if (!Object.prototype.hasOwnProperty.call(networkMap, n)) {
      continue;
    }

    const networkInfo = networkMap[n];

    if (networkInfo.genesisHash === hash) {
      return n;
    }
  }

  return null;
};

export const getNetworkJsonByInfo = (chainMap: Record<string, _ChainInfo>, isEthereumAddress: boolean, isEthereumNetwork: boolean, info?: string | null | number): _ChainInfo | null => {
  if (!info) {
    if (isEthereumNetwork) {
      const networks = Object.values(chainMap).filter(_isChainEvmCompatible);

      return networks[0];
    }

    return null;
  }

  const networks = Object.values(chainMap);

  for (const chain of networks) {
    if (isEthereumNetwork) {
      if (_getEvmChainId(chain) === info) {
        return chain;
      }
    } else {
      if (_getSubstrateGenesisHash(chain) && !_isChainEvmCompatible(chain)) {
        return chain;
      }
    }
  }

  return null;
};
