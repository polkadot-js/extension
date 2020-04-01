import React from 'react';
import styled from 'styled-components';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import Account from './Account';

interface Props extends AccountWithChildren {
  indent?: number;
  className?: string;
}

function AccountsTree ({ indent = 0, className, ...account }: Props) {
  return (
    <>
      <Account {...account} />
      {account.children && (
        <IndentedDiv indent={indent + 1}>
          {account.children.map((child, index) => (
            <AccountsTree key={`${index}:${child.address}`} {...child} indent={indent + 1} />
          ))}
        </IndentedDiv>
      )}
    </>
  );
}

const IndentedDiv = styled.div<{ indent: number }>`
  padding-left: ${({ indent = 0 }): number => indent === 0 ? 0 : 15}px;
`;

export default AccountsTree;
