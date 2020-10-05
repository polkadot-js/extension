// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from 'react';
import styled from 'styled-components';

import { AccountContext, ErrorBoundary } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import AccountsTree from './AccountsTree';
import AddAccount from './AddAccount';

export default function Accounts (): React.ReactElement {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);

  return (
    <>
      {(hierarchy.length === 0)
        ? <AddAccount />
        : (
          <>
            <Header
              showAdd
              showSettings
              text={t<string>('Accounts')}
            />
            <ErrorBoundary trigger='accounts'>
              <AccountsArea>
                {hierarchy.map((json, index): React.ReactNode => (
                  <AccountsTree
                    {...json}
                    key={`${index}:${json.address}`}
                  />
                ))}
              </AccountsArea>
            </ErrorBoundary>
          </>
        )
      }
    </>
  );
}

const AccountsArea = styled.div`
  height: 100%;
  overflow-y: scroll;
  margin-top: -25px;
  padding-top: 25px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;
