// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';

type ChildFilter = (account: AccountJson) => AccountWithChildren;

function compareByCreationTime (a: AccountJson, b: AccountJson): number {
  return (a.whenCreated || Infinity) - (b.whenCreated || Infinity);
}

function compareByString (a?: string, b?: string): number {
  const nameA = a?.toUpperCase() || '';
  const nameB = b?.toUpperCase() || '';

  if (nameA < nameB) {
    return -1;
  }

  if (nameA > nameB) {
    return 1;
  }

  // names are equal
  return 0;
}

function compareByName (a: AccountJson, b: AccountJson): number {
  return compareByString(a.name, b.name);
}

function compareByPath (a: AccountJson, b: AccountJson): number {
  return compareByString(a.suri, b.suri);
}

function compareByNameThenCreation (a: AccountJson, b: AccountJson): number {
  const res = compareByName(a, b);

  return res === 0 ? compareByCreationTime(a, b) : res;
}

function compareByNameThenPath (a: AccountJson, b: AccountJson): number {
  const res = compareByName(a, b);

  return res === 0 ? compareByPath(a, b) : res;
}

export function accountWithChildren (accounts: AccountJson[]): ChildFilter {
  return (account: AccountJson): AccountWithChildren => {
    const children = accounts
      .filter(({ parentAddress }) => account.address === parentAddress)
      .map(accountWithChildren(accounts))
      .sort(compareByNameThenPath);

    return children.length === 0
      ? account
      : { children, ...account };
  };
}

export function buildHierarchy (accounts: AccountJson[]): AccountWithChildren[] {
  return accounts
    .filter(({ parentAddress }) =>
      // it is a parent
      !parentAddress ||
      // we don't have a parent for this one
      !accounts.some(({ address }) => parentAddress === address)
    )
    .map(accountWithChildren(accounts))
    .sort(compareByNameThenCreation);
}
