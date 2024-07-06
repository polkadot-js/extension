// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* global chrome */

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
    const lockSigner = async () => {
      setIsLocked(null);

      try {
        const { isLocked, remainingTime } = await isSignLocked(signId);

        setIsLocked(isLocked);

        await chrome.alarms.create('SIGNER_TIMEOUT', { delayInMinutes: remainingTime / 60000 });

        if (!isLocked) {
          setSavePass(true);
        }
      } catch (error) {
        console.error('Error locking signer:', error);
      }
    };

    const resetAlarm = async () => {
      return new Promise((resolve, reject) => {
        chrome.alarms.clear('SIGNER_TIMEOUT', (cleared) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(cleared);
          }
        });
      });
    };

    const executeLockSigner = async () => {
      if (!isExternal) {
        await lockSigner();
        await resetAlarm();
      }
    };

    executeLockSigner().then(async () => {
      return await executeLockSigner();
    }).catch((error) => console.error('Error clearing the alarm: ', error));
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
