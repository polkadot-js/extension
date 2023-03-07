// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';

import React from 'react';
import styled from 'styled-components';

import Account from './Account';

interface Props extends AccountWithChildren {
  className?: string;
  parentName?: string;
  childrenAccounts?: AccountJson[];
  withCheckbox?: boolean;
  withMenu?: boolean;
  showHidden?: boolean;
  isAuthList?: boolean;
}

function AccountsTree({
  className,
  isAuthList = false,
  parentName,
  showHidden = true,
  suri,
  withCheckbox = false,
  withMenu = true,
  ...account
}: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      {(showHidden || !account.isHidden) && (
        <Account
          {...account}
          className={withCheckbox ? 'accountWichCheckbox' : ''}
          parentName={parentName}
          suri={suri}
          withCheckbox={withCheckbox}
          withMenu={withMenu}
        />
      )}
      {/* this is needed for the RequestComponent */}
      {isAuthList &&
        account?.children?.map((child, index) => (
          <AccountsTree
            key={`${index}:${child.address}`}
            {...child}
            isAuthList={isAuthList}
            parentName={account.name}
            showHidden={showHidden}
            withCheckbox={withCheckbox}
            withMenu={withMenu}
          />
        ))}
    </div>
  );
}

export default styled(AccountsTree)`
    display: flex;
    flex-direction: column;
    gap: 8px;
    
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
