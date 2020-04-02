// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext } from 'react';
import QrImage from '../../assets/qr.svg';

import { AccountContext, AddAccount, Button, ButtonArea, ButtonWithSubtitle, Header, MediaContext, Svg } from '../../components';
import Account from './Account';
import styled from 'styled-components';
import { AccountJson } from '@polkadot/extension-base/background/types';

type Props = {};

function findMasterAccount (accounts: AccountJson[]): AccountJson | undefined {
  return accounts
    .map((account) => ({ ...account, whenCreated: account.whenCreated || Infinity }))
    .sort((a, b) => a.whenCreated - b.whenCreated)
    .find((account) => !account.parentAddress && !account.isExternal);
}

export default function Accounts (): React.ReactElement<Props> {
  const accounts = useContext(AccountContext);
  const mediaAllowed = useContext(MediaContext);

  const masterAccount = findMasterAccount(accounts);

  return (
    <>
      {(accounts.length === 0)
        ? <AddAccount />
        : (
          <>
            <Header
              showSettings
              text={'Accounts'}
            />
            <AccountsArea>
              {accounts.map((json, index): React.ReactNode => (
                <Account
                  {...json}
                  key={`${index}:${json.address}`}
                />
              ))}
            </AccountsArea>
          </>
        )
      }
      <ButtonArea>
        <ButtonWithSubtitle
          subTitle={masterAccount ? 'Derive from master' : 'With new seed'}
          title='Create New Account'
          to={masterAccount ? `/account/derive/${masterAccount.address}` : '/account/create'}
        />
        <ButtonWithSubtitle
          subTitle='I have a pre-existing seed'
          title='Import an Account'
          to='/account/import-seed'
        />
        {mediaAllowed && (
          <QrButton to='/account/import-qr'>
            <Svg src={QrImage} />
          </QrButton>
        )}
      </ButtonArea>
    </>
  );
}

const QrButton = styled(Button)`
  width: 60px;

  ${Svg} {
    width: 20px;
    height: 20px;
    background: ${({ theme }): string => theme.buttonTextColor};
  }
`;

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
