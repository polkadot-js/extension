// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { initApi } from '@subwallet/extension-koni-base/api/dotsama/api';
import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { getCurrentProvider } from '@subwallet/extension-koni-base/utils';

export * from './api';

export function getGenesis (name: string): string {
  if (PREDEFINED_NETWORKS[name] &&
    PREDEFINED_NETWORKS[name].genesisHash &&
    PREDEFINED_NETWORKS[name].genesisHash.toLowerCase() !== 'unknown') {
    return PREDEFINED_NETWORKS[name].genesisHash;
  }

  console.log(`Genesis hash of ${name} is not available`);

  return `not_available_genesis_hash__${name}`;
}

export function connectDotSamaApis (networks = PREDEFINED_NETWORKS, networkMap: Record<string, NetworkJson>): Record<string, ApiProps> {
  const apisMap: Record<string, ApiProps> = {};

  Object.keys(networks).forEach((networkKey) => {
    const network = networks[networkKey];

    if (!networkMap[networkKey] || !network.genesisHash || network.genesisHash.toLowerCase() === 'unknown' || !network.currentProvider) {
      return;
    }

    apisMap[networkKey] = initApi(networkKey, getCurrentProvider(network), networkMap[networkKey].isEthereum);
  });

  return apisMap;
}

export default connectDotSamaApis;
