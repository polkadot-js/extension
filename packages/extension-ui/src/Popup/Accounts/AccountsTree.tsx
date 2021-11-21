// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountWithChildren } from '@polkadot/extension-base/background/types';

import React from 'react';

import Account from './Account';

interface Props extends AccountWithChildren {
  parentName?: string;
}

export default function AccountsTree ({ parentName, suri, ...account }: Props): React.ReactElement<Props> {
  return (
    <>
      <Account
        {...account}
        parentName={parentName}
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
