// Copyright 2019-2020 @polkadot/extension-chains authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import chains from './chains';

interface Option {
  text: string;
  value: string;
}

const hashes: Option[] = [
  {
    text: 'Allow use on any chain',
    value: ''
  },
  ...chains.map(({ chain, genesisHash }) => ({
    text: `${chain} (${chain.startsWith('Kusama') ? 'canary' : 'live'})`,
    value: genesisHash
  }))
];

export default hashes;
