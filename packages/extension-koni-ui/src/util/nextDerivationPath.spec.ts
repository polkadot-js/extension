// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

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
