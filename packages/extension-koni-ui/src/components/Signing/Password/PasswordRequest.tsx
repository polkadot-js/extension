// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { Warning } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import MigrateMasterPasswordModal from '@subwallet/extension-koni-ui/components/Modal/MigrateMasterPasswordModal';
import { SigningContext } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useState } from 'react';
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

  const [isVisible, setIsVisible] = useState<boolean>(false);

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

  const onOpenModal = useCallback(() => {
    setIsVisible(true);
  }, []);

  const onCloseModal = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <div className={className}>
      { children }

      <div className='password-signing__separator' />
      {
        !account.isMasterPassword && (
          <Warning
            className='auth-transaction-error migrate-notification'
            noIcon={true}
          >
            <div>
              {t<string>('Your must migrate password before signing')}
            </div>
            <Button
              className='button-migrate'
              onClick={onOpenModal}
            >
              {t('Migrate')}
            </Button>
          </Warning>
        )
      }
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
      {
        isVisible && (
          <MigrateMasterPasswordModal
            address={account.address}
            className='migrate-modal'
            closeModal={onCloseModal}
          />
        )
      }
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

  .migrate-notification {
    .warning-message {
      flex: 1;
      justify-content: space-between;
    }
  }

  .button-migrate {
    width: 90px;
    height: 30px;
  }
`));
