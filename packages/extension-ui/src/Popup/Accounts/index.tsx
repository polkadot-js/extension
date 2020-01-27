// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext } from 'react';
import QrImage from '../../assets/qr.svg';

import {
  AccountContext,
  Button,
  Header,
  MediaContext,
  AddAccount,
  ButtonArea,
  Svg,
  ButtonWithSubtitle
} from '../../components';
import Account from './Account';
import styled from 'styled-components';

type Props = {};

export default function Accounts (): React.ReactElement<Props> {
  const accounts = useContext(AccountContext);
  const mediaAllowed = useContext(MediaContext);

  return (
    <>
      {(accounts.length === 0)
        ? <AddAccount />
        : (
          <>
            <Header showSettings text={'Accounts'} />
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
          to='/account/create'
          title='Create New Account'
          subTitle='With new seed'
        />
        <ButtonWithSubtitle
          to='/account/import-seed'
          title='Import an Account'
          subTitle='I have a pre-existing seed'
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
