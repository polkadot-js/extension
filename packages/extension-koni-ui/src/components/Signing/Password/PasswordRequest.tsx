// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InputWithLabel, Warning } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import { SigningContext } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  children: JSX.Element | JSX.Element[];
  handlerStart: (password: string) => void;
  hideConfirm: () => Promise<void> | void;
}

const PasswordRequest = ({ children,
  className,
  handlerStart,
  hideConfirm }: Props) => {
  const { t } = useTranslation();

  const { onErrors, setPasswordError, signingState } = useContext(SigningContext);

  const { errors, isBusy, passwordError } = signingState;

  const [password, setPassword] = useState<string>('');

  const onSubmit = useCallback(() => {
    handlerStart(password);
  }, [handlerStart, password]);

  const _onChangePass = useCallback((value: string) => {
    setPassword(value);
    setPasswordError(false);
    onErrors([]);
  }, [onErrors, setPasswordError]);

  const renderError = useCallback(() => {
    if (errors && errors.length) {
      return errors.map((err) =>
        (
          <Warning
            className='auth-transaction-error'
            isDanger
            key={err}
          >
            {t<string>(err)}
          </Warning>
        )
      );
    } else {
      return <></>;
    }
  }, [errors, t]);

  return (
    <div className={CN(className)}>
      { children }

      <div className='password-signing__separator' />

      <InputWithLabel
        disabled={isBusy}
        isError={passwordError}
        label={t<string>('Unlock account with password')}
        onChange={_onChangePass}
        type='password'
        value={password}
      />
      { renderError() }
      <div className={'password-signing-btn-container'}>
        <Button
          className={'password-signing-cancel-button'}
          isDisabled={isBusy}
          onClick={hideConfirm}
        >
          {t('Reject')}
        </Button>
        <Button
          isBusy={isBusy}
          isDisabled={!password || passwordError}
          onClick={onSubmit}
        >
          {t('Confirm')}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(styled(PasswordRequest)(({ theme }: Props) => `
  padding-left: 15px;
  padding-right: 15px;
  display: flex;
  flex-direction: column;
  flex: 1;

  .signing-error {
    margin-top: 10px;
  }

  .password-signing__separator {
    margin-top: 30px;
    margin-bottom: 18px;
  }

  .password-signing__separator:before {
    content: "";
    height: 1px;
    display: block;
    background: ${theme.boxBorderColor};
  }

  .password-signing-btn-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  .password-signing-cancel-button {
    color: ${theme.textColor3};
    background: ${theme.buttonBackground1};
  }

  .auth-transaction-error {
    margin-top: 10px
  }
`));
