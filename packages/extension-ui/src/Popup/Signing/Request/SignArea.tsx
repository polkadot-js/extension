// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ExtrinsicPayload } from '@polkadot/types/interfaces';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { PASSWORD_EXPIRY_MIN } from '@polkadot/extension-base/defaults';
import { Ledger } from '@polkadot/hw-ledger';

import { ActionBar, ActionContext, Button, ButtonArea, Checkbox, Link } from '../../../components';
import useTranslation from '../../../hooks/useTranslation';
import { approveSignPassword, cancelSignRequest, isSignLocked } from '../../../messaging';
import LedgerUnlock from '../LedgerUnlock';
import Unlock from '../Unlock';

interface Props {
  accountIndex?: number;
  addressOffset? : number;
  buttonText: string;
  className?: string;
  error: string | null;
  genesisHash?: string;
  isExternal?: boolean;
  isFirst: boolean;
  isHardware?: boolean;
  onSignature?: ({ signature }: { signature: string }) => void;
  payload?: ExtrinsicPayload;
  setError: (value: string | null) => void;
  signId: string;
}

function SignArea ({ accountIndex, addressOffset, buttonText, className, error, genesisHash, isExternal, isFirst, isHardware, onSignature, payload, setError, signId } : Props): JSX.Element {
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

  const _onSignLedger = useCallback(
    (ledger: Ledger): void => {
      if (!payload || !onSignature) {
        return;
      }

      setIsBusy(true);
      ledger.sign(payload.toU8a(true), Number(accountIndex), Number(addressOffset))
        .then((signature) => {
          onSignature(signature);
        }).catch((e: Error) => {
          setError(e.message);
          setIsBusy(false);
        });
    },
    [accountIndex, addressOffset, onSignature, payload, setError]
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
    <ButtonArea className={className}>
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
          <Button
            isBusy={isBusy}
            isDisabled={(!!isLocked && !password) || !!error}
            onClick={_onSign}
          >
            {buttonText}
          </Button>
        </>
      )}
      { isExternal && isHardware && (
        <LedgerUnlock
          error={error}
          genesisHash={genesisHash}
          isBusy={isBusy}
          onSign={_onSignLedger}
          setError={setError}
        />
      )}
      <ActionBar className='cancelButton'>
        <Link
          isDanger
          onClick={_onCancel}
        >
          {t<string>('Cancel')}
        </Link>
      </ActionBar>
    </ButtonArea>
  );
}

export default styled(SignArea)`
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
