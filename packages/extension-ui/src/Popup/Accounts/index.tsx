// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getAccountCache } from '@polkadot/extension-ui/messaging';

import React, { useContext, useEffect } from 'react';
import styled from 'styled-components';

import AccountsTree from './AccountsTree';
import AddAccount from './AddAccount';
import { AccountContext, ActionContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';

export default function Accounts (): React.ReactElement {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);
  const onAction = useContext(ActionContext);

  useEffect(() => {
    // redirect to account creation if there is a cached account
    // this indicates that there was an ongoing account creation
    getAccountCache().then((account) => {
      if (account?.address) {
        onAction('/account/create');
      }
    }).catch((e) => console.error(e));
  }, [onAction]);

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
            <AccountsArea>
              {hierarchy.map((json, index): React.ReactNode => (
                <AccountsTree
                  {...json}
                  key={`${index}:${json.address}`}
                />
              ))}
            </AccountsArea>
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
