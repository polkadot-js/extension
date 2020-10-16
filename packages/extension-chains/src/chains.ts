// Copyright 2019-2020 @polkadot/extension-chains authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MetadataDefBase } from '@polkadot/extension-inject/types';
import networks from '@polkadot/networks';

const hashes: MetadataDefBase[] =
networks.map((network) => ({
  chain: network.displayName,
  genesisHash: network.genesisHash?.[0] || '0x',
  icon: network.icon,
  ss58Format: network.prefix
}));

export default hashes;
