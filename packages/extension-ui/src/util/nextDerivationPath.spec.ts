// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type * as _ from '@polkadot/dev-test/globals.d.ts';

import { nextDerivationPath } from './nextDerivationPath.js';

describe('Generate Derivation Path', () => {
  const acc = (address: string, parentAddress?: string): {
    address: string;
    parentAddress?: string;
  } => ({
    address,
    parentAddress
  });

  it('generates path for first masters child', () => {
    expect(nextDerivationPath([acc('a')], 'a')).toEqual('//0');
  });

  it('generates path for third masters child', () => {
    expect(nextDerivationPath([acc('a'), acc('b', 'a'), acc('c', 'a')], 'a')).toEqual('//2');
  });

  it('generates path for masters child when another root exists', () => {
    expect(nextDerivationPath([acc('a'), acc('b', 'a'), acc('c', 'a'), acc('d')], 'a')).toEqual('//2');
  });

  it('generates path for masters grandchild', () => {
    expect(nextDerivationPath([acc('a'), acc('b', 'a'), acc('c', 'b'), acc('d', 'b')], 'b')).toEqual('//2');
  });
});
