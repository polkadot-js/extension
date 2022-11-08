// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InputWithLabel } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import { SigningContext } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  children: JSX.Element;
  handlerStart: (password: string) => void;
  hideConfirm: () => Promise<void> | void;
}

const PasswordRequest = ({ children,
  className,
  handlerStart,
  hideConfirm }: Props) => {
  const { t } = useTranslation();

  const { setPasswordError, signingState } = useContext(SigningContext);

  const { isBusy, passwordError } = signingState;

  const [password, setPassword] = useState<string>('');

  const onSubmit = useCallback(() => {
    handlerStart(password);
  }, [handlerStart, password]);

  const _onChangePass = useCallback((value: string) => {
    setPassword(value);
    setPasswordError(false);
  }, [setPasswordError]);

  return (
    <div className={CN(className)}>
      { children }

      <div className='bonding-auth__separator' />

      <InputWithLabel
        isError={passwordError}
        label={t<string>('Unlock account with password')}
        onChange={_onChangePass}
        type='password'
        value={password}
      />

      <div className={'bonding-auth-btn-container'}>
        <Button
          className={'bonding-auth-cancel-button'}
          isDisabled={isBusy}
          onClick={hideConfirm}
        >
          Reject
        </Button>
        <Button
          isBusy={isBusy}
          isDisabled={!password || passwordError}
          onClick={onSubmit}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};

export default React.memo(styled(PasswordRequest)(({ theme }: Props) => `
`));
