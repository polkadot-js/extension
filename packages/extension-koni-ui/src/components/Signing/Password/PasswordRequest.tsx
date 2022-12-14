// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { Warning } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import RequireMigratePasswordModal from '@subwallet/extension-koni-ui/components/Signing/RequireMigratePassword';
import { SigningContext } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  account: AccountJson;
  className?: string;
  children: JSX.Element | JSX.Element[];
  handlerStart: () => void;
  hideConfirm: () => Promise<void> | void;
}

const PasswordRequest = ({ account,
  children,
  className,
  handlerStart,
  hideConfirm }: Props) => {
  const { t } = useTranslation();

  const { signingState } = useContext(SigningContext);

  const { errors, isBusy } = signingState;

  const onSubmit = useCallback(() => {
    handlerStart();
  }, [handlerStart]);

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
    <div className={className}>
      { children }

      <div className='password-signing__separator' />
      <RequireMigratePasswordModal address={account.address} />
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
          isDisabled={!account.isMasterPassword}
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
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    position: sticky;
    bottom: 0;
    background-color: ${theme.background};
    margin-left: -15px;
    margin-right: -15px;
    padding-left: 15px;
    padding-right: 15px;
    padding-top: 15px;
    padding-bottom: 15px;
  }

  .password-signing-cancel-button {
    color: ${theme.textColor3};
    background: ${theme.buttonBackground1};
  }

  .auth-transaction-error {
    margin-top: 10px
  }
`));
