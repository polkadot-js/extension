// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import {NetWorkMetadataDef} from "@polkadot/extension-base/background/types";

function getKnownHashes(): NetWorkMetadataDef[] {
  const result: NetWorkMetadataDef[] = [];

  Object.keys(NETWORKS).forEach(networkKey => {
    const {chain, genesisHash, icon, ss58Format, group} = NETWORKS[networkKey];

    if (!genesisHash || genesisHash.toLowerCase() === 'unknown') {
      return;
    }

    result.push({
      chain,
      networkName: networkKey,
      genesisHash,
      icon: icon || 'substrate',
      ss58Format,
      group
    });
  });

  return result;
}

const knowHashes: NetWorkMetadataDef[] = getKnownHashes();

const hashes = [...knowHashes];

export default hashes;
