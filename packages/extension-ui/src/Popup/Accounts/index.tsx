// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext } from 'react';
import styled from 'styled-components';

import QrImage from '../../assets/qr.svg';
import { AccountContext, Button, ButtonArea, ButtonWithSubtitle, MediaContext, Svg } from '../../components';
import { AddAccount, Header } from '../../partials';
import AccountsTree from './AccountsTree';

type Props = {};

export default function Accounts (): React.ReactElement<Props> {
  const { hierarchy } = useContext(AccountContext);
  const mediaAllowed = useContext(MediaContext);

  return (
    <>
      {(hierarchy.length === 0)
        ? <AddAccount />
        : (
          <>
            <Header
              showSettings
              text={'Accounts'}
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
      <ButtonArea>
        <ButtonWithSubtitle
          subTitle='With new seed'
          title='Create New Account'
          to='/account/create'
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
