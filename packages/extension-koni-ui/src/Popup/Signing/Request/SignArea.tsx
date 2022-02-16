// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { PASSWORD_EXPIRY_MIN } from '@polkadot/extension-base/defaults';
import { ActionBar, ActionContext, Button, Checkbox, Link } from '../../../components';
import useTranslation from '../../../hooks/useTranslation';
import { approveSignPassword, cancelSignRequest, isSignLocked } from '../../../messaging';
import Unlock from '../Unlock';

interface Props {
  buttonText: string;
  className?: string;
  error: string | null;
  isExternal?: boolean;
  isFirst: boolean;
  setError: (value: string | null) => void;
  signId: string;
}

function SignArea ({ buttonText, className, error, isExternal, isFirst, setError, signId }: Props): JSX.Element {
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

    return () => { !!timeout && clearTimeout(timeout); };
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
          <div className='sign-button'>
            <Button
              isBusy={isBusy}
              isDisabled={(!!isLocked && !password) || !!error}
              onClick={_onSign}
            >
              {buttonText}
            </Button>
          </div>
        </>
      )}
      <ActionBar className='cancel-button'>
        <Link
          isDanger
          onClick={_onCancel}
        >
          {t<string>('Cancel')}
        </Link>
      </ActionBar>
    </div>
  );
}

export default styled(SignArea)`
  flex-direction: column;
  padding: 15px;

  .cancel-button {
    margin-top: 4px;
    margin-bottom: 4px;
    display: flex;
    justify-content: center;

    a {
      margin: auto;
      text-decoration: underline;
    }

    span {
      font-weight: 500;
    }
  }

  .sign-button {
    padding: 0 85px;
  }
`;
