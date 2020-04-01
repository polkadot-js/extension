import {AccountJson, AccountWithChildren} from '@polkadot/extension-base/background/types';

const isRoot = (account: AccountJson): boolean => !account.parentAddress;
const isChild = (parent: AccountJson) => (account: AccountJson): boolean => account.parentAddress === parent.address;

export const accountWithChildren = (allAccounts: AccountJson[]) => (account: AccountJson): AccountWithChildren => {
  const children = allAccounts
    .filter(isChild(account))
    .map(accountWithChildren(allAccounts));

  if (children.length === 0) {
    return account;
  }

  return {
    ...account,
    children
  };
};

export const buildHierarchy = (accounts: AccountJson[]) => accounts
  .filter(isRoot)
  .map(accountWithChildren(accounts));
