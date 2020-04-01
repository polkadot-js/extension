import { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';
import { buildHierarchy } from "./buildHierarchy";

const testHierarchy = (accounts: AccountJson[], expected: AccountWithChildren[]): void => {
  expect(buildHierarchy(accounts)).toEqual(expected);
};

describe('Use Account Hierarchy', () => {
  const acc = (address: string, parentAddress?: string, derivationPath?: string): {
    address: string;
    derivationPath?: string;
    parentAddress?: string;
  } => ({
    address,
    parentAddress,
    derivationPath
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
});
