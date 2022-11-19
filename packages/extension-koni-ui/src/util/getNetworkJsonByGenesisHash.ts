// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';

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

export const getNetworkJsonByInfo = (networkMap: Record<string, NetworkJson>, isEthereumAddress: boolean, isEthereumNetwork: boolean, info?: string | null | number): NetworkJson | null => {
  if (!info) {
    if (isEthereumNetwork) {
      const networks = Object.values(networkMap).filter((network) => network.isEthereum);

      return networks.find((network) => network.active) || networks[0];
    }

    return null;
  }

  const networks = Object.values(networkMap);

  for (const network of networks) {
    if (isEthereumNetwork) {
      if (network.evmChainId === info) {
        return network;
      }
    } else {
      if (network.genesisHash.includes(info as string) && !!network.isEthereum === isEthereumAddress) {
        return network;
      }
    }
  }

  return null;
};
