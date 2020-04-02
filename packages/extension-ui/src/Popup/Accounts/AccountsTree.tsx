import React from 'react';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import Account from './Account';

interface Props extends AccountWithChildren {
  parentName?: string;
  className?: string;
}

function AccountsTree ({ className, parentName, ...account }: Props) {
  return (
    <>
      <Account {...account} parentName={parentName} />
      {account?.children?.map((child, index) => (
        <AccountsTree key={`${index}:${child.address}`} {...child} parentName={account.name} />
      ))}
    </>
  );
}

export default AccountsTree;
