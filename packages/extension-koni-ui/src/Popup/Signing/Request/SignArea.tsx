// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PASSWORD_EXPIRY_MIN } from '@subwallet/extension-base/defaults';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { ActionContext, Button, Checkbox } from '../../../components';
import useTranslation from '../../../hooks/useTranslation';
import { approveSignPassword, cancelSignRequest, isSignLocked } from '../../../messaging';
import Unlock from '../Unlock';

interface Props extends ThemeProps {
  buttonText: string;
  className?: string;
  error: string | null;
  isExternal?: boolean;
  isFirst: boolean;
  setError: (value: string | null) => void;
  signId: string;
  children?: React.ReactElement
}

function SignArea ({ buttonText, children, className, error, isExternal, isFirst, setError, signId }: Props): JSX.Element {
  const [savePass, setSavePass] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const onAction = useContext(ActionContext);
  const { t } = useTranslation();

  useEffect(() => {
    setIsLocked(null);
    let timeout: NodeJS.Timeout;

    !isExternal && isSignLocked(signId)
      .then(({ isLocked, remainingTime }) => {
        setIsLocked(isLocked);
        timeout = setTimeout(() => {
          setIsLocked(true);
        }, remainingTime);

        // if the account was unlocked check the remember me
        // automatically to prolong the unlock period
        !isLocked && setSavePass(true);
      })
      .catch((error: Error) => console.error(error));

    return () => {
      !!timeout && clearTimeout(timeout);
    };
  }, [isExternal, signId]);

  const _onSign = useCallback(
    (): Promise<void> => {
      setIsBusy(true);

      return approveSignPassword(signId, savePass, password)
        .then((): void => {
          setIsBusy(false);
          onAction();
        })
        .catch((error: Error): void => {
          setIsBusy(false);
          setError(error.message);
          console.error(error);
        });
    },
    [onAction, password, savePass, setError, setIsBusy, signId]
  );

  const _onCancel = useCallback(
    (): Promise<void> => cancelSignRequest(signId)
      .then(() => onAction())
      .catch((error: Error) => console.error(error)),
    [onAction, signId]
  );

  const RememberPasswordCheckbox = () => (
    <Checkbox
      checked={savePass}
      label={ isLocked
        ? t<string>(
          'Remember my password for the next {{expiration}} minutes',
          { replace: { expiration: PASSWORD_EXPIRY_MIN } }
        )
        : t<string>(
          'Extend the period without password by {{expiration}} minutes',
          { replace: { expiration: PASSWORD_EXPIRY_MIN } }
        )
      }
      onChange={setSavePass}
    />
  );

  return (
    <div className={className}>
      {children}
      {isFirst && !isExternal && (
        <>
          { isLocked && (
            <Unlock
              error={error}
              isBusy={isBusy}
              onSign={_onSign}
              password={password}
              setError={setError}
              setPassword={setPassword}
            />
          )}
          <RememberPasswordCheckbox />

          <div className='sign-button-container'>
            <Button
              className='sign-button'
              onClick={_onCancel}
            >
              <span>
                {t<string>('Cancel')}
              </span>

            </Button>
            <Button
              className='sign-button'
              isBusy={isBusy}
              isDisabled={(!!isLocked && !password) || !!error}
              onClick={_onSign}
            >
              {buttonText}
            </Button>
          </div>
        </>
      )}

    </div>
  );
}

export default styled(SignArea)(({ theme }: Props) => `
  flex-direction: column;
  position: sticky;
  bottom: 0;
  margin-left: -15px;
  margin-right: -15px;
  margin-bottom: -15px;
  padding: 0 15px 15px;
  background-color: ${theme.background};

  .sign-button-container {
    display: flex;
  }

  .sign-button {
    flex: 1;
  }

  .sign-button:first-child {
    background-color: ${theme.buttonBackground1};
    margin-right: 8px;

    span {
      color: ${theme.textColor3};
    }
  }

  .sign-button:last-child {
    margin-left: 8px;
  }
`);
