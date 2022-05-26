// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NETWORK_STATUS, NetworkJson, NetWorkMetadataDef } from '@subwallet/extension-base/background/KoniTypes';
import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';

function getDefaultHashes (): NetWorkMetadataDef[] {
  const result: NetWorkMetadataDef[] = [];

  Object.keys(PREDEFINED_NETWORKS).forEach((networkKey) => {
    const { active, apiStatus, chain, genesisHash, groups, icon, isEthereum, paraId, ss58Format } = PREDEFINED_NETWORKS[networkKey];

    let isAvailable = true;

    // todo: add more logic in further update
    if (!genesisHash || genesisHash.toLowerCase() === 'unknown') {
      isAvailable = false;
    }

    result.push({
      chain,
      networkKey,
      genesisHash,
      icon: isEthereum ? 'ethereum' : (icon || 'polkadot'),
      ss58Format,
      groups,
      isEthereum: !!isEthereum,
      paraId,
      isAvailable,
      active,
      apiStatus: apiStatus || NETWORK_STATUS.DISCONNECTED
    });
  });

  return result;
}

const knownHashes: NetWorkMetadataDef[] = getDefaultHashes();

const defaultChains = [...knownHashes];

export function _getKnownHashes (networkMap: Record<string, NetworkJson>): NetWorkMetadataDef[] {
  const result: NetWorkMetadataDef[] = [];

  Object.keys(networkMap).forEach((networkKey) => {
    if (networkMap[networkKey].active) {
      const { active, apiStatus, chain, genesisHash, groups, icon, isEthereum, paraId, ss58Format } = networkMap[networkKey];

      let isAvailable = true;

      // todo: add more logic in further update
      if (!genesisHash || genesisHash.toLowerCase() === 'unknown') {
        isAvailable = false;
      }

      result.push({
        chain,
        networkKey,
        genesisHash,
        icon: isEthereum ? 'ethereum' : (icon || 'polkadot'),
        ss58Format,
        groups,
        isEthereum: !!isEthereum,
        paraId,
        isAvailable,
        active,
        apiStatus: apiStatus || NETWORK_STATUS.DISCONNECTED
      });
    }
  });

  return result;
}

export default defaultChains;
