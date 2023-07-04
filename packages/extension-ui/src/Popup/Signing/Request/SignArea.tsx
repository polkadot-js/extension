// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { FormEvent, useCallback, useContext, useEffect, useId, useState } from 'react';
import styled from 'styled-components';

import { PASSWORD_EXPIRY_MIN } from '@polkadot/extension-base/defaults';

import { ActionContext, BottomWrapper, Button, ButtonArea, Checkbox } from '../../../components';
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
  isLast: boolean;
}

function SignArea({ buttonText, className, error, isExternal, isFirst, isLast, setError, signId }: Props): JSX.Element {
  const [savePass, setSavePass] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const onAction = useContext(ActionContext);
  const { t } = useTranslation();
  const formId = useId();

  useEffect(() => {
    setIsLocked(null);
    let timeout: NodeJS.Timeout;

    !isExternal &&
      isSignLocked(signId)
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

  const _onSign = useCallback(async () => {
    const params = new URLSearchParams({
      isLast: isLast.toString(),
      isSuccess: 'true',
      message: t<string>('Transaction signed')
    });

    try {
      setIsBusy(true);
      await approveSignPassword(signId, savePass, password);
      setIsBusy(false);

      onAction(`/request-status?${params.toString()}`);
    } catch (error) {
      setIsBusy(false);
      setError((error as Error).message);
      console.error(error);
    }
  }, [isLast, onAction, password, savePass, setError, signId, t]);

  const _onCancel = useCallback(async (): Promise<void> => {
    const params = new URLSearchParams({
      isLast: isLast.toString(),
      isSuccess: 'false',
      message: t<string>('Transaction declined')
    });

    try {
      await cancelSignRequest(signId);

      onAction(`/request-status?${params.toString()}`);
    } catch (error) {
      console.error(error);
    }
  }, [isLast, onAction, signId, t]);

  const StyledCheckbox = styled(Checkbox)`
    margin-left: 8px;
`;

  const RememberPasswordCheckbox = () => (
    <StyledCheckbox
      checked={savePass}
      label={
        isLocked
          ? t<string>('Remember password for {{expiration}} minutes', {
              replace: { expiration: PASSWORD_EXPIRY_MIN }
            })
          : t<string>('Extend the period without password by {{expiration}} minutes', {
              replace: { expiration: PASSWORD_EXPIRY_MIN }
            })
      }
      onChange={setSavePass}
    />
  );

  const isFormValid = isFirst && !error && (!isLocked || password);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isFormValid) {
      _onSign();
    }
  };

  return (
    <Container>
      <form
        id={formId}
        onSubmit={onSubmit}
      >
        <div className={className}>
          {isFirst && !isExternal && (
            <>
              {isLocked && (
                <Unlock
                  error={error}
                  isBusy={isBusy}
                  password={password}
                  setError={setError}
                  setPassword={setPassword}
                />
              )}
              <RememberPasswordCheckbox />
            </>
          )}
        </div>
      </form>
      <CustomButtonArea>
        <Button
          data-decline-transaction
          isDanger
          isDisabled={!isFirst}
          onClick={_onCancel}
          type='button'
        >
          {t<string>('Decline')}
        </Button>
        <Button
          data-sign-transaction
          form={formId}
          isBusy={isBusy}
          isDisabled={!isFormValid}
          isSuccess
          type='submit'
        >
          {buttonText}
        </Button>
      </CustomButtonArea>
    </Container>
  );
}

export default styled(SignArea)`
  flex-direction: column;
  padding-top: 6px;
  padding-bottom: 6px;
`;

const Container = styled.div`
  & ${BottomWrapper} {
    margin-inline: -16px;
  }  
`;

const CustomButtonArea = styled(ButtonArea)`
  margin-inline: 16px;
`;
