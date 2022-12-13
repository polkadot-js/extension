// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ActionContext, Button, InputWithLabel, ValidatedInput, Warning } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { keyringChangeMasterPassword } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { allOf, isNotShorterThan, isSameAs, Validator } from '@subwallet/extension-koni-ui/util/validators';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

const MIN_LENGTH = 6;

const ChangeMasterPassword = ({ className }: Props) => {
  const { t } = useTranslation();

  const onAction = useContext(ActionContext);

  const [isBusy, setIsBusy] = useState(false);
  const [oldPassword, setOldPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const [pass1, setPass1] = useState<string | null>(null);
  const [pass2, setPass2] = useState<string | null>(null);
  const isFirstPasswordValid = useMemo(() => isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')), [t]);
  const isSecondPasswordValid = useCallback((firstPassword: string): Validator<string> => allOf(
    isNotShorterThan(1, t<string>('Please fill repeat password')),
    isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')),
    isSameAs(firstPassword, t<string>('Passwords do not match'))
  ), [t]);

  const [errors, setErrors] = useState<string[]>([]);

  const isOldPasswordValid = useMemo(() => isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')), [t]);

  const onChangeOldPassword = useCallback((value: string | null) => {
    setOldPassword(value);
    setErrors([]);
  }, []);

  const onComplete = useCallback(() => {
    window.localStorage.setItem('popupNavigation', '/');
    onAction('/');
  }, [onAction]);

  const handleOnSubmit = useCallback(() => {
    if (oldPassword && newPassword) {
      setIsBusy(true);

      setTimeout(() => {
        keyringChangeMasterPassword({
          createNew: false,
          newPassword: newPassword,
          oldPassword: oldPassword
        }).then((res) => {
          if (!res.status) {
            setErrors(res.errors);
          } else {
            onComplete();
          }
        }).catch((e) => {
          setErrors([(e as Error).message]);
        }).finally(() => {
          setIsBusy(false);
        });
      }, 200);
    }
  }, [oldPassword, newPassword, onComplete]);

  useEffect((): void => {
    setNewPassword(pass1 && pass2 ? pass1 : null);
    setErrors([]);
  }, [pass1, pass2]);

  return (
    <div className={CN(className)}>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Change Master Password')}
      />
      <div className='body-container'>
        <ValidatedInput
          className={className}
          component={InputWithLabel}
          data-input-password
          disable={isBusy}
          isFocus={true}
          label={t('Old Password')}
          onValidatedChange={onChangeOldPassword}
          type='password'
          validator={isOldPasswordValid}
        />
        <ValidatedInput
          component={InputWithLabel}
          data-input-password
          disable={isBusy}
          label={t<string>('New master password')}
          onValidatedChange={setPass1}
          type='password'
          validator={isFirstPasswordValid}
        />
        {
          pass1 && (
            <ValidatedInput
              component={InputWithLabel}
              data-input-repeat-password
              disable={isBusy}
              label={t<string>('Confirm new master password')}
              onValidatedChange={setPass2}
              type='password'
              validator={isSecondPasswordValid(pass1 || '')}
            />
          )
        }
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
          className={CN('cancel-btn btn')}
          isDisabled={isBusy}
          onClick={onComplete}
        >
          <span>{t<string>('Cancel')}</span>
        </Button>
        <Button
          className={CN('btn')}
          data-export-button
          isBusy={isBusy}
          isDisabled={!oldPassword || !newPassword || errors.length > 0}
          onClick={handleOnSubmit}
        >
          {t<string>('Save')}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(styled(ChangeMasterPassword)(({ theme }: Props) => `
  .body-container {
     padding: 8px 22px;
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

  .footer-container {
    padding: 22px 20px;
    display: flex;
    flex-direction: row;
    margin: 0 -8px;
    position: sticky;
    bottom: 0;

    .cancel-btn {
      background-color: ${theme.buttonBackground1};

      span {
        color: ${theme.buttonTextColor2};
      }
    }

    .btn {
      margin: 0 8px;
    }
  }
`));
