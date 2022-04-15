// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson, NetWorkMetadataDef } from '@polkadot/extension-base/background/KoniTypes';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';

function getKnownHashes (): NetWorkMetadataDef[] {
  const result: NetWorkMetadataDef[] = [];

  Object.keys(NETWORKS).forEach((networkKey) => {
    const { chain, genesisHash, groups, icon, isEthereum, paraId, ss58Format } = NETWORKS[networkKey];

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
      active: true
    });
  });

  return result;
}

const knowHashes: NetWorkMetadataDef[] = getKnownHashes();

const hashes = [...knowHashes];

export function _getKnownHashes (networkMap: Record<string, NetworkJson>): NetWorkMetadataDef[] {
  const result: NetWorkMetadataDef[] = [];

  Object.keys(networkMap).forEach((networkKey) => {
    const { active, chain, genesisHash, groups, icon, isEthereum, paraId, ss58Format } = networkMap[networkKey];

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
      active
    });
  });

  return result;
}

export default hashes;
