// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps } from '@polkadot/extension-base/background/KoniTypes';
import { initApi } from '@polkadot/extension-koni-base/api/dotsama/api';

import NETWORKS from '../../api/endpoints';

export * from './api';

export function getGenesis (name: string): string {
  if (NETWORKS[name] &&
    NETWORKS[name].genesisHash &&
    NETWORKS[name].genesisHash.toLowerCase() !== 'unknown') {
    return NETWORKS[name].genesisHash;
  }

  console.log(`Genesis hash of ${name} is not available`);

  return `not_available_genesis_hash__${name}`;
}

export function connectDotSamaApis (networks = NETWORKS): Record<string, ApiProps> {
  const apisMap: Record<string, ApiProps> = {};

  Object.keys(networks).forEach((networkKey) => {
    const network = networks[networkKey];

    if (!network.genesisHash || network.genesisHash.toLowerCase() === 'unknown' || !network.provider) {
      return;
    }
    apisMap[networkKey] = initApi(network.provider);
  });

  return apisMap;
}

export default connectDotSamaApis;
