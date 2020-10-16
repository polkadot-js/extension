// Copyright 2019-2020 @polkadot/extension-chains authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MetadataDefBase } from '@polkadot/extension-inject/types';
import { all } from '@polkadot/networks';

const hashes: MetadataDefBase[] =
all.filter(({ genesisHash }) => !!genesisHash)
  .map((network) => ({
    chain: network.displayName.replace('Relay Chain', ''),
    genesisHash: (network.genesisHash as string[])[0],
    icon: network.icon || 'jdenticon',
    ss58Format: network.prefix
  }));

export default hashes;
