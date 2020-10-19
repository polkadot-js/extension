// Copyright 2019-2020 @polkadot/extension-chains authors & contributors
// SPDX-License-Identifier: Apache-2.0

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
    text: chain,
    value: genesisHash
  }))
];

export default hashes;
