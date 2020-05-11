// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';
import { buildHierarchy } from './buildHierarchy';

const testHierarchy = (accounts: AccountJson[], expected: AccountWithChildren[]): void => {
  expect(buildHierarchy(accounts)).toEqual(expected);
};

describe('Use Account Hierarchy', () => {
  const acc = (address: string, parentAddress?: string, whenCreated?: number): {
    address: string;
    whenCreated?: number;
    parentAddress?: string;
  } => ({
    address,
    parentAddress,
    whenCreated
  });

  test('for empty account list, returns empty list', () => {
    testHierarchy([], []);
  });

  test('returns one account', () => {
    testHierarchy([acc('a')], [acc('a')]);
  });

  test('puts child account into children field of parent: single child', () => {
    testHierarchy([acc('a'), acc('b', 'a')], [
      { address: 'a', children: [acc('b', 'a')] }
    ]);
  });

  test('puts child account into children field of parent: more children', () => {
    testHierarchy([acc('a'), acc('b', 'a'), acc('c', 'a')], [
      { address: 'a', children: [acc('b', 'a'), acc('c', 'a')] }
    ]);
  });

  test('puts child account into children field of parent: 2 roots', () => {
    testHierarchy([acc('a'), acc('b', 'a'), acc('c', 'a'), acc('d')], [
      { address: 'a', children: [acc('b', 'a'), acc('c', 'a')] },
      acc('d')
    ]);
  });

  test('handles grandchildren', () => {
    testHierarchy([acc('a'), acc('b', 'a'), acc('c', 'b')], [{
      address: 'a',
      children: [{
        ...acc('b', 'a'),
        children: [acc('c', 'b')]
      }]
    }]);
  });

  test('sorts accounts by creation time', () => {
    testHierarchy(
      [acc('a', undefined, 2), acc('b', 'a', 4), acc('c', 'a', 3), acc('d', undefined, 1)],
      [acc('d', undefined, 1), { address: 'a', children: [acc('c', 'a', 3), acc('b', 'a', 4)], whenCreated: 2 }]
    );
  });

  test('if creation time is missing, puts account at the back of a list', () => {
    testHierarchy(
      [acc('a'), acc('b', undefined, 2), acc('c', undefined, 1)],
      [acc('c', undefined, 1), acc('b', undefined, 2), acc('a')]
    );
  });
});
