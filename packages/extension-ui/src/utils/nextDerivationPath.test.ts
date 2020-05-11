// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { nextDerivationPath } from './nextDerivationPath';

describe('Generate Derivation Path', () => {
  const acc = (address: string, parentAddress?: string): {
    address: string;
    parentAddress?: string;
  } => ({
    address,
    parentAddress
  });

  test('generates path for first masters child', () => {
    expect(nextDerivationPath([acc('a')], 'a')).toEqual('//0');
  });

  test('generates path for third masters child', () => {
    expect(nextDerivationPath([acc('a'), acc('b', 'a'), acc('c', 'a')], 'a')).toEqual('//2');
  });

  test('generates path for masters child when another root exists', () => {
    expect(nextDerivationPath([acc('a'), acc('b', 'a'), acc('c', 'a'), acc('d')], 'a')).toEqual('//2');
  });

  test('generates path for masters grandchild', () => {
    expect(nextDerivationPath([acc('a'), acc('b', 'a'), acc('c', 'b'), acc('d', 'b')], 'b')).toEqual('//2');
  });
});
