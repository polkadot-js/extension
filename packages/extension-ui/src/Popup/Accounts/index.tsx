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
  Title,
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
      <Header showSettings />
      {
        (accounts.length === 0)
          ? <AddAccount />
          : (
            <AccountsArea>
              <>
                <Title>Accounts</Title>
                {
                  accounts.map((json, index): React.ReactNode => (
                    <Account
                      {...json}
                      key={`${index}:${json.address}`}
                    />
                  ))
                }
              </>
            </AccountsArea>
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
  }
`;

const AccountsArea = styled.div`
  height: 100%;
  overflow: scroll;
`;
