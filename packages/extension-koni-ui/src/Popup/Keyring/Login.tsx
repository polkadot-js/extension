// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Button, InputWithLabel, Theme, ValidatedInput, Warning } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { keyringUnlock } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isNotShorterThan } from '@subwallet/extension-koni-ui/util/validators';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

const MIN_LENGTH = 6;

const Login = ({ className }: Props) => {
  const { t } = useTranslation();
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const [loading, setLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string | null>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const isFirstPasswordValid = useMemo(() => isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')), [t]);

  const onChangePassword = useCallback((value: string | null) => {
    setPassword(value);
    setErrors([]);
  }, []);

  const onSubmit = useCallback((password: string | null) => {
    if (password) {
      setLoading(true);

      keyringUnlock({
        password: password
      }).then((res) => {
        if (!res.status) {
          setErrors(res.errors);
        }
      }).catch((e) => {
        setErrors([(e as Error).message]);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, []);

  const onPress = useCallback(() => {
    onSubmit(password);
  }, [password, onSubmit]);

  return (
    <div className={CN(className)}>
      <Header />
      <div className='body'>
        <img
          alt=''
          className='logo'
          src={themeContext.logo}
        />
        <div className='title'>{t('Welcome Back')}</div>
        <div className='sub-title'>{t('The decentralized web awaits')}</div>
        <ValidatedInput
          className='password-input'
          component={InputWithLabel}
          data-input-password
          disabled={loading}
          onEnter={onSubmit}
          onValidatedChange={onChangePassword}
          placeholder={t('Password')}
          type={'password'}
          validator={isFirstPasswordValid}
        />
        {
          errors.map((err, index) =>
            (
              <Warning
                className='item-error'
                isDanger
                key={index}
              >
                {t(err)}
              </Warning>
            )
          )
        }
        <Button
          className='button-unlock'
          isBusy={loading}
          isDisabled={!password}
          onClick={onPress}
        >
          {t('Unlock')}
        </Button>
        <div className='help'>
          <span>{t('Need help? Contact ')}</span>
          <span className='contact'>{t('SubWallet Support')}</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(styled(Login)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;

  // header container
  .container {
    box-shadow: none;
  }

  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;

    .logo {
      margin-top: 40px;
      height: 146px;
      width: 146px;
      margin-bottom: 16px;
    }

    .title {
      font-style: normal;
      font-weight: 500;
      font-size: 32px;
      line-height: 44px;
      text-align: center;
      color: ${theme.textColor};
      margin-bottom: 4px;
    }

    .sub-title {
      font-style: normal;
      font-weight: 600;
      font-size: 16px;
      line-height: 26px;
      text-align: center;
      color: ${theme.textColor};
      opacity: 0.7;
      margin-bottom: 16px;
    }

    .password-input input {
      width: 360px;
      color: ${theme.checkboxColor};
      background-color: ${theme.textColor};
      font-style: normal;
      font-weight: 400;
      font-size: 15px;
      line-height: 26px;
    }

    .button-unlock {
      width: 360px;
      margin-top: 26px;
      margin-bottom: 40px;
    }

    .help {
      font-style: normal;
      font-weight: 400;
      font-size: 14px;
      line-height: 24px;
      text-align: center;
      color: ${theme.textColor};

      .contact {
        color: ${theme.primaryColor};
        cursor: pointer;
      }
    }

    .item-error {
      margin: 10px 0;
      width: 360px;
    }
  }
`));
