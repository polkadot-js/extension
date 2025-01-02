// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';

import { PASSWORD_EXPIRY_MIN } from '@polkadot/extension-base/defaults';

import { ActionBar, ActionContext, Button, ButtonArea, Checkbox, Link } from '../../../components/index.js';
import { useTranslation } from '../../../hooks/index.js';
import { approveSignPassword, cancelSignRequest, isSignLocked } from '../../../messaging.js';
import { styled } from '../../../styled.js';
import Unlock from '../Unlock.js';

interface Props {
  buttonText: string;
  className?: string;
  error: string | null;
  isExternal?: boolean;
  isFirst: boolean;
  setError: (value: string | null) => void;
  signId: string;
}

function SignArea ({ buttonText, className, error, isExternal, isFirst, setError, signId }: Props): React.ReactElement {
  const [savePass, setSavePass] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const onAction = useContext(ActionContext);
  const { t } = useTranslation();

  useEffect(() => {
    setIsLocked(null);
    let timeout: ReturnType<typeof setTimeout>;

    !isExternal && isSignLocked(signId)
      .then(({ isLocked, remainingTime }) => {
        setIsLocked(isLocked);
        timeout = setTimeout(() => {
          setIsLocked(true);
        }, remainingTime);

        !isLocked && setSavePass(true);
      })
      .catch((error: Error) => console.error(error));

    return () => {
      !!timeout && clearTimeout(timeout);
    };
  }, [isExternal, signId]);

  const _onSign = useCallback(
    (): void => {
      setIsBusy(true);
      approveSignPassword(signId, savePass, password)
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
    (): void => {
      cancelSignRequest(signId)
        .then(() => onAction())
        .catch((error: Error) => console.error(error));
    },
    [onAction, signId]
  );

  const RememberPasswordCheckbox = () => (
    <Checkbox
      checked={savePass}
      label={isLocked
        ? t(
          'Remember my password for the next {{expiration}} minutes',
          { replace: { expiration: PASSWORD_EXPIRY_MIN } }
        )
        : t(
          'Extend the period without password by {{expiration}} minutes',
          { replace: { expiration: PASSWORD_EXPIRY_MIN } }
        )
      }
      onChange={setSavePass}
    />
  );

  return (
    <ButtonArea className={className}>
      {isFirst && !isExternal && (
        <>
          {isLocked && (
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
          <Button
            isBusy={isBusy}
            isDisabled={(!!isLocked && !password) || !!error}
            onClick={_onSign}
          >
            {buttonText}
          </Button>
        </>
      )}
      <ActionBar className='cancelButton'>
        <Link
          isDanger
          onClick={_onCancel}
        >
          {t('Cancel')}
        </Link>
      </ActionBar>
    </ButtonArea>
  );
}

export default styled(SignArea) <Props>`
  flex-direction: column;
  padding: 6px 24px;

  .cancelButton {
    margin-top: 4px;
    margin-bottom: 4px;
    text-decoration: underline;

    a {
      margin: auto;
    }
  }
`;
