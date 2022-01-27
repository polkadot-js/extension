// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetWorkMetadataDef } from '@polkadot/extension-base/background/KoniTypes';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';

function getKnownHashes (): NetWorkMetadataDef[] {
  const result: NetWorkMetadataDef[] = [];

  Object.keys(NETWORKS).forEach((networkKey) => {
    const { chain, genesisHash, group, icon, isEthereum, ss58Format } = NETWORKS[networkKey];

    if (!genesisHash || genesisHash.toLowerCase() === 'unknown') {
      return;
    }

    result.push({
      chain,
      networkKey,
      genesisHash,
      icon: isEthereum ? 'ethereum' : (icon || 'polkadot'),
      ss58Format,
      group,
      isEthereum: !!isEthereum
    });
  });

  return result;
}

const knowHashes: NetWorkMetadataDef[] = getKnownHashes();

const hashes = [...knowHashes];

export default hashes;
