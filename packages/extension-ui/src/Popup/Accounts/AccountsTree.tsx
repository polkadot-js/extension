// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountWithChildren } from '@polkadot/extension-base/background/types';

import React from 'react';

import { accountsBalanceType } from '../../util/HackathonUtilFiles/hackatonUtils';
import Account from './Account';

interface Props extends AccountWithChildren {
  parentName?: string;
  balances?: accountsBalanceType[] | null;
  setBalances?: React.Dispatch<React.SetStateAction<accountsBalanceType[]>>;
}

export default function AccountsTree ({ balances, parentName, setBalances, suri, ...account }: Props): React.ReactElement<Props> {
  return (
    <>
      <Account
        {...account}
        balances={balances}
        parentName={parentName}
        setBalances ={setBalances}
        suri={suri}
      />
      {account?.children?.map((child, index) => (
        <AccountsTree
          key={`${index}:${child.address}`}
          {...child}
          parentName={account.name}
        />
      ))}
    </>
  );
}
