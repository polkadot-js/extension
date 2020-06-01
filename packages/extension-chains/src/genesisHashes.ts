// Copyright 2019-2020 @polkadot/extension-chains authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

interface Option {
  text: string;
  value: string;
}

const hashes: Option[] = [
  {
    text: 'Allow use on any chain',
    value: ''
  },
  {
    text: 'Polkadot CC1 (live)',
    value: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3'
  },
  {
    text: 'Kusama (canary)',
    value: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'
  },
  {
    text: 'Edgeware (live)',
    value: '0x742a2ca70c2fda6cee4f8df98d64c4c670a052d9568058982dad9d5a7a135c5b'
  }
];

export default hashes;
