// Copyright 2019-2020 @polkadot/extension-chains authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MetadataDefBase } from '@polkadot/extension-inject/types';

const hashes: MetadataDefBase[] = [
  // keep at the top (favoritism)
  {
    chain: 'Polkadot',
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
    chain: 'Crab',
    genesisHash: '0x34f61bfda344b3fad3c3e38832a91448b3c613b199eb23e5110a635d71c13c65',
    icon: 'substrate',
    ss58Format: 42
  },
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
  },
  {
    chain: 'Stafi',
    genesisHash: '0x290a4149f09ea0e402c74c1c7e96ae4239588577fe78932f94f5404c68243d80',
    icon: 'substrate',
    ss58Format: 20
  },
  {
    chain: 'Subsocial',
    genesisHash: '0x0bd72c1c305172e1275278aaeb3f161e02eccb7a819e63f62d47bd53a28189f8',
    icon: 'substrate',
    ss58Format: 28
  }
];

export default hashes;
