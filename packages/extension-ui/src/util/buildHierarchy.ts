// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';

type ChildFilter = (account: AccountJson) => AccountWithChildren;

function compareByCreationTime (a: AccountJson, b: AccountJson): number {
  return (a.whenCreated || Infinity) - (b.whenCreated || Infinity);
}

export function accountWithChildren (accounts: AccountJson[]): ChildFilter {
  return (account: AccountJson): AccountWithChildren => {
    const children = accounts
      .filter(({ parentAddress }) => account.address === parentAddress)
      .map(accountWithChildren(accounts))
      .sort(compareByCreationTime);

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
    .sort(compareByCreationTime);
}
