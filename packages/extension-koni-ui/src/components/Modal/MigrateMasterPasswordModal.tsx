// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Button, InputWithLabel, ValidatedInput, Warning } from '@subwallet/extension-koni-ui/components';
import Modal from '@subwallet/extension-koni-ui/components/Modal/index';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { keyringMigrateMasterPassword } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isNotShorterThan } from '@subwallet/extension-koni-ui/util/validators';
import CN from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import icon from '../../assets/Illustration.png';
import bg from '../../assets/MasterPassword_bg.png';

interface Props extends ThemeProps {
  className?: string;
  closeModal: () => void;
  address: string;
}

const MIN_LENGTH = 6;

const MigrateMasterPasswordModal = ({ address, className, closeModal }: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string | null>(null);

  const [errors, setErrors] = useState<string[]>([]);

  const isFirstPasswordValid = useMemo(() => isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')), [t]);

  const handleOnSubmit = useCallback((password: string | null) => {
    if (password) {
      setLoading(true);

      keyringMigrateMasterPassword({
        address: address,
        password: password
      }).then((res) => {
        if (!res.status) {
          setErrors(res.errors);
        } else {
          closeModal();
        }
      }).catch((e) => {
        setErrors([(e as Error).message]);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [address, closeModal]);

  const onChangePassword = useCallback((value: string | null) => {
    setPassword(value);
    setErrors([]);
  }, []);

  const onPress = useCallback(() => {
    handleOnSubmit(password);
  }, [password, handleOnSubmit]);

  return (
    <Modal
      className={CN(className)}
      maskClosable={false}
      wrapperClassName={'master-password-modal'}
    >
      <div className={'modal-header'}>
        <div className='modal-title'>
          {t('Apply master password')}
        </div>
        <img
          alt='shield'
          className='modal-icon'
          src={icon}
        />
      </div>
      <div className={'modal-body'}>
        <div className={CN('sub-title')}>
          {t('To continue, please apply the master password')}
        </div>
        <ValidatedInput
          className={className}
          component={InputWithLabel}
          data-input-password
          isFocused={true}
          label={t('Old Password')}
          labelQuestionIcon={true}
          labelTooltip={t('Your old password is the password you used before creating the master password. Please enter your old password to confirm your application of the master password.')}
          onEnter={handleOnSubmit}
          onValidatedChange={onChangePassword}
          type='password'
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
        <div className='separator' />
      </div>
      <div className='modal-footer'>
        <Button
          className='cancel-button'
          isDisabled={loading}
          onClick={closeModal}
        >
          {t('Cancel')}
        </Button>
        <Button
          className='save-button'
          isBusy={loading}
          isDisabled={!password}
          onClick={onPress}
        >
          {t('Apply')}
        </Button>
      </div>
    </Modal>
  );
};

export default React.memo(styled(MigrateMasterPasswordModal)(({ theme }: Props) => `
  .subwallet-modal.master-password-modal {
    width: 390px;
    max-width: 390px;
    background-color: ${theme.popupBackground};
    border-radius: 15px;
    top: 10%;
    z-index: 1050;
    position: fixed;
    left: 0px;
    right: 0px;
    margin: 0px auto;
    padding: 15px;
    bottom: unset;

    .modal-header {
      height: 100px;
      margin: -15px -15px 0;
      padding: 12px;
      background-image: url(${bg});
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      border-radius: 8px 8px 0 0;
      background-color: ${theme.background};


      .modal-title {
        font-style: normal;
        font-weight: 500;
        font-size: 20px;
        line-height: 32px;
        color: ${theme.textColor};
        margin-left: 4px;
      }

      .modal-icon {
        height: 79px;
        width: 96px;
      }
    }

    .modal-body {
      .sub-title {
        font-weight: 500;
        font-size: 15px;
        line-height: 26px;
        color: ${theme.textColor2};
        margin-bottom: 4px;
        margin-top: 20px;
      }

      .separator {
        margin-top: 24px;
        margin-bottom: 16px;
      }

      .separator:before {
        content: "";
        height: 1px;
        display: block;
        background: ${theme.boxBorderColor};
      }

      .item-error {
        margin: 10px 0;
      }
    }

    .modal-footer {
      padding-bottom: 5px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      flex: 1;
      margin: 0 -8px;

      .save-button {
        flex: 1;
        margin: 0 8px;
      }

      .button__disabled-overlay {
        background: ${theme.popupBackground};
      }

      .cancel-button {
        flex: 1;
        margin: 0 8px;
        background-color: ${theme.toggleInactiveBgc};

        .children {
          color: ${theme.buttonTextColor2};
        }
      }
    }
  }

  .validated-input__warning, .item-error {
    background: transparent;
    margin-top: 8px;
    padding: 0;

    .warning-image {
      width: 20px;
      margin-right: 8px;
      transform: translateY(2px);
    }

    .warning-message {
      color: ${theme.crowdloanFailStatus};
    }
  }

  &.ui--Tooltip {
    max-width: 330px;
    text-align: left;
    font-style: normal;
    font-weight: 400;
    font-size: 13px;
    line-height: 24px;
  }
`));
