// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Button, InputWithLabel, ValidatedInput, Warning } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { keyringChangeMasterPassword } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { allOf, isNotShorterThan, isSameAs, Validator } from '@subwallet/extension-koni-ui/util/validators';
import CN from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import icon from '../../assets/Illustration.png';
import bg from '../../assets/MasterPassword_bg.png';

interface Props extends ThemeProps {
  className?: string;
  onComplete: () => void;
}

const MIN_LENGTH = 6;

const CreateMasterPassword = ({ className, onComplete }: Props) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pass1, setPass1] = useState<string | null>(null);
  const [pass2, setPass2] = useState<string | null>(null);

  const [errors, setErrors] = useState<string[]>([]);

  const isFirstPasswordValid = useMemo(() => isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')), [t]);

  const isSecondPasswordValid = useCallback((firstPassword: string): Validator<string> => allOf(
    isNotShorterThan(1, t<string>('Please fill repeat password')),
    isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')),
    isSameAs(firstPassword, t<string>('Passwords do not match'))
  ), [t]);

  const handleOnSubmit = useCallback(() => {
    if (password) {
      setLoading(true);

      keyringChangeMasterPassword({
        createNew: true,
        newPassword: password
      }).then((res) => {
        if (!res.status) {
          setErrors(res.errors);
        } else {
          onComplete();
        }
      }).catch((e) => {
        setErrors([(e as Error).message]);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [password, onComplete]);

  useEffect((): void => {
    setPassword(pass1 && pass2 ? pass1 : null);
  }, [pass1, pass2]);

  return (
    <div
      className={CN(className)}
    >
      <div className={'header-container'}>
        <div className='header-title'>
          {t('Create master password')}
        </div>
        <img
          alt='shield'
          className='header-icon'
          src={icon}
        />
      </div>
      <div className={'body-container'}>
        <div className='description'>
          {t('Your master password is the password that allows access to multiple accounts. Once a master password is confirmed, you will not need to manually type your password with every transaction.')}
        </div>
        <ValidatedInput
          className={className}
          component={InputWithLabel}
          data-input-password
          label={t('Master Password')}
          onValidatedChange={setPass1}
          type='password'
          validator={isFirstPasswordValid}
        />
        <ValidatedInput
          className={className}
          component={InputWithLabel}
          data-input-repeat-password
          label={t('Confirm master Password')}
          onValidatedChange={setPass2}
          type='password'
          validator={isSecondPasswordValid(pass1 || '')}
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
      </div>
      <div className='footer-container'>
        <Button
          className='save-button'
          isBusy={loading}
          isDisabled={!password}
          onClick={handleOnSubmit}
        >
          {t('Create master password')}
        </Button>
        <div className='help'>
          <span>{t('Need help? Contact ')}</span>
          <span className='contact'>{t('SubWallet Support')}</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(styled(CreateMasterPassword)(({ theme }: Props) => `
  .header-container {
    height: 100px;
    padding: 12px 28px;
    background-image: url(${bg});
    background-size: cover;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background-color: ${theme.background};


    .header-title {
      font-style: normal;
      font-weight: 500;
      font-size: 20px;
      line-height: 32px;
      color: ${theme.textColor};
      margin-left: 12px;
    }

    .header-icon {
      height: 79px;
      width: 96px;
    }
  }

  .body-container {
    padding: 24px 40px 0;

    .description {
      font-style: normal;
      font-weight: 400;
      font-size: 14px;
      line-height: 24px;
      color: ${theme.textColor2};
      margin-bottom: 8px;
    }

    .item-error {
      margin: 10px 0;
    }
  }

  .footer-container {
    padding: 24px 40px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .save-button {
      // width: 200px;
    }

    .help {
      margin-top: 36px;
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
  }

  &.ui--Tooltip {
    max-width: 330px;
    text-align: left;
    font-style: normal;
    font-weight: 400;
    font-size: 13px;
    line-height: 24px;
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
`));
