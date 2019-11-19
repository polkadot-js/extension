// Copyright 2019 @polkadot/extension-ui authors & contributors
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
  Title
} from '../../components';
import Account from './Account';
import styled from 'styled-components';

type Props = {};

export default function Accounts (): React.ReactElement<Props> {
  const accounts = useContext(AccountContext);
  const mediaAllowed = useContext(MediaContext);
  return (
    <>
      <Header showSettings/>
      <Title>Accounts</Title>
      {
        (accounts.length === 0)
          ? <AddAccount
            header='add accounts'
            to='/account/create'
            imageVisible
          >
            You currently don&apos;t have any accounts. Either create a new account or if you have an existing account you wish to use, import it with the seed phrase.
          </AddAccount>
          : <AccountsArea>
            {
              accounts.map((json, index): React.ReactNode => (
                <Account
                  {...json}
                  key={`${index}:${json.address}`}
                />))
            }
          </AccountsArea>
      }
      <ButtonArea>
        <ButtonWithSubtitle to='/account/create'>
          <h4>Create New Account</h4>
          <p>With new seed</p>
        </ButtonWithSubtitle>
        <ButtonWithSubtitle to='/account/import-seed'>
          <h4>Import an Account</h4>
          <p>I have a pre-existing seed</p>
        </ButtonWithSubtitle>
        {mediaAllowed && (
          <QrButton to='/account/import-qr'>
            <Svg src={QrImage}/>
          </QrButton>
        )}
      </ButtonArea>
    </>
  );
}

const ButtonWithSubtitle = styled(Button)`
  button {
    padding-top: 0;
    padding-bottom: 0;
  }
  h4 {
    margin: 0;
    font-weight: 600;
    font-size: 15px;
    line-height: 20px;
  }
  p {
    margin: 0;
    font-weight: 400;
    font-size: 12px;
    line-height: 16px;
  }
`;

const QrButton = styled(Button)`
  width: 60px;

  ${Svg} {
    width: 20px;
    height: 20px;
  }
`;

const AccountsArea = styled.div`
  height: 100%;
  overflow: scroll;
`;
