// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import Button from '@subwallet/extension-koni-ui/components/Button';
import ButtonArea from '@subwallet/extension-koni-ui/components/ButtonArea';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import logo from '../assets/sub-wallet-logo.svg';
import { ActionContext } from '../components';
import useTranslation from '../hooks/useTranslation';

interface Props extends ThemeProps {
  className?: string;
}

function Welcome ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const _onClick = useCallback(
    (): void => {
      window.localStorage.setItem('welcome_read', 'ok');
      onAction();
    },
    [onAction]
  );

  return (
    <>
      <Header
        isNotHaveAccount
        isWelcomeScreen
      />
      <div className={className}>
        <div className='welcome-container'>
          <img
            alt='logo'
            className='welcome-logo'
            src={logo}
          />
          <span className='welcome-title'>
            Welcome Back
          </span>
          <span className='welcome-subtitle'>
            The decentralized web awaits
          </span>
          <ButtonArea className='welcome-button-wrapper'>
            <Button onClick={_onClick}>{t<string>('Get started')}</Button>
          </ButtonArea>
        </div>
      </div>
    </>
  );
}

export default styled(Welcome)(({ theme }: Props) => `
  .welcome-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 30px 47px;
  }

  .welcome-logo {
    margin: 15px 0 30px 0;
    width: 118px;
    height: 118px;
  }

  .welcome-title {
    font-size: 32px;
    line-height: 44px;
    color: ${theme.textColor};
    font-weight: 500;
  }

  .welcome-subtitle {
    margin-top: 3px;
    font-size: 18px;
    line-height: 30px;
    color: ${theme.textColor2};
  }

  .welcome-button-wrapper {
    width: 100%;
    margin-top: 30px;
  }

  p {
    color: ${theme.subTextColor};
    margin-bottom: 6px;
    margin-top: 0;
  }
`);
