// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';

const isRoot = (account: AccountJson): boolean => !account.parentAddress;
const isChild = (parent: AccountJson) => (account: AccountJson): boolean => account.parentAddress === parent.address;
const compareByCreationTime = (a: AccountJson, b: AccountJson): number => (a.whenCreated || Infinity) - (b.whenCreated || Infinity);

export const accountWithChildren = (allAccounts: AccountJson[]) => (account: AccountJson): AccountWithChildren => {
  const children = allAccounts
    .filter(isChild(account))
    .map(accountWithChildren(allAccounts))
    .sort(compareByCreationTime);

  if (children.length === 0) {
    return account;
  }

  return {
    ...account,
    children
  };
};

export const buildHierarchy = (accounts: AccountJson[]): AccountWithChildren[] =>
  accounts
    .filter(isRoot)
    .map(accountWithChildren(accounts))
    .sort(compareByCreationTime);
