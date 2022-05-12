// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import LogosMap from '@subwallet/extension-koni-ui/assets/logo';

function getLogoByGenesisHashMap (): Record<string, string> {
  const result: Record<string, string> = {};

  Object.keys(PREDEFINED_NETWORKS).forEach((networkKey) => {
    const { genesisHash } = PREDEFINED_NETWORKS[networkKey];

    if (!genesisHash || genesisHash.toLowerCase() === 'unknown') {
      return;
    }

    result[genesisHash] = LogosMap[networkKey] || LogosMap.default;
  });

  return result;
}

const logoByGenesisHashMap = getLogoByGenesisHashMap();

export function getLogoByGenesisHash (hash?: string): string {
  if (!hash) {
    return LogosMap.default;
  }

  return logoByGenesisHashMap[hash] || LogosMap.default;
}

export default logoByGenesisHashMap;
