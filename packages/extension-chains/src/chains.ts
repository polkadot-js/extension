// Copyright 2019-2020 @polkadot/extension-chains authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MetadataDefBase } from '@polkadot/extension-inject/types';

const hashes: MetadataDefBase[] = [
  // keep at the top (favoritism)
  {
    chain: 'Polkadot CC1',
    genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    icon: 'polkadot',
    ss58Format: 0
  },
  {
    chain: 'Kusama',
    genesisHash: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
    icon: 'polkadot',
    ss58Format: 2
  },
  // alphabetical to avoid (further) favorites
  {
    chain: 'Edgeware',
    genesisHash: '0x742a2ca70c2fda6cee4f8df98d64c4c670a052d9568058982dad9d5a7a135c5b',
    icon: 'substrate',
    ss58Format: 7
  },
  {
    chain: 'Kulupu',
    genesisHash: '0xf7a99d3cb92853d00d5275c971c132c074636256583fee53b3bbe60d7b8769ba',
    icon: 'substrate',
    ss58Format: 16
  }
];

export default hashes;
