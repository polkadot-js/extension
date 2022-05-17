// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountWithChildren } from '@polkadot/extension-base/background/types';

import React from 'react';
import styled from 'styled-components';

import Account from './Account';

interface Props extends AccountWithChildren {
  className?: string
  parentName?: string;
  withCheckbox?: boolean
  withMenu?: boolean
}

function AccountsTree ({ className, parentName, suri, withCheckbox = false, withMenu = true, ...account }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>

      <Account
        {...account}
        className={withCheckbox ? 'accountWichCheckbox' : ''}
        parentName={parentName}
        suri={suri}
        withCheckbox={withCheckbox}
        withMenu={withMenu}
      />
      {account?.children?.map((child, index) => (
        <AccountsTree
          key={`${index}:${child.address}`}
          {...child}
          parentName={account.name}
          withCheckbox={withCheckbox}
          withMenu={withMenu}
        />
      ))}
    </div>
  );
}

export default styled(AccountsTree)`
  .accountWichCheckbox {
    display: flex;
    align-items: center;

    & .address {
      flex: 1;
    }

    & .accountTree-checkbox label span {
      top: -12px;
    }
  }
`;
