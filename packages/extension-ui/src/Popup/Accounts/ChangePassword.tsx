// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { FormEvent, useCallback, useContext, useId, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { getUserInputs } from '@polkadot/extension-ui/components/PasswordField/getFeedback';
import Message from '@polkadot/extension-ui/components/PasswordField/Message';
import useAccountName from '@polkadot/extension-ui/hooks/useAccountName';

import {
  ActionContext,
  Address,
  Button,
  ButtonArea,
  InputWithLabel,
  ScrollWrapper,
  ValidatedInput,
  VerticalSpace
} from '../../components';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { changePassword } from '../../messaging';
import { Header, Password } from '../../partials';
import { Result } from '../../util/validators';

const EditPassword = () => {
  const { t } = useTranslation();
  const { show } = useToast();

  const { address } = useParams<{ address: string }>();

  const onAction = useContext(ActionContext);
  const goBack = () => onAction('..');

  const accountName = useAccountName(address);

  const [isBusy, setIsBusy] = useState(false);
  const [providedPass, setProvidedPass] = useState('');
  const [isProvidedPassWrong, setIsProvidedPassWrong] = useState(false);
  const [nextPass, setNextPass] = useState<string | null>(null);

  const formId = useId();

  const saveChanges = async (): Promise<void> => {
    if (nextPass === null) {
      return;
    }

    setIsBusy(true);

    try {
      await changePassword(address, providedPass, nextPass);
      goBack();
      show(t<string>('Account password changed successfully'), 'success');
    } catch (error) {
      show(t<string>('The current password is invalid'), 'critical');
      setIsProvidedPassWrong(true);
    }

    setIsBusy(false);
  };

  const onProvidedPassChange = useCallback(
    (value: string) => {
      setProvidedPass(value);
      setIsProvidedPassWrong(false);
    },
    [setIsProvidedPassWrong, setProvidedPass]
  );

  const isFormValid = Boolean(providedPass && nextPass);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isFormValid) {
      saveChanges();
    }
  };

  return (
    <>
      <Header
        text={t<string>('Change account password')}
        withBackArrow
        withHelp
      />
      <ScrollWrapper>
        <Form
          id={formId}
          onSubmit={onSubmit}
        >
          <Address address={address} />
          <InputWrapper>
            <ValidatedInput
              component={StyledInputWithLabel}
              label={t<string>('Current password')}
              onValidatedChange={onProvidedPassChange}
              shouldCheckCapsLock
              type='password'
              validator={Result.ok}
            />
            {isProvidedPassWrong && (
              <StyleMessage messageType='critical'>{t('Unable to decode using the supplied passphrase')}</StyleMessage>
            )}
          </InputWrapper>
          <Password
            label={t('New password')}
            onChange={setNextPass}
            repeatLabel={t('Confirm new password')}
            validationUserInput={getUserInputs(accountName)}
          />
        </Form>
        <VerticalSpace />
        <ButtonArea>
          <Button
            onClick={goBack}
            secondary
            type='button'
          >
            {t<string>('Cancel')}
          </Button>
          <Button
            form={formId}
            isBusy={isBusy}
            isDisabled={!isFormValid}
            onClick={saveChanges}
            type='submit'
          >
            {t<string>('Save')}
          </Button>
        </ButtonArea>
      </ScrollWrapper>
    </>
  );
};

const Form = styled.form`
  & > :not(:last-child) {
    margin-bottom: 24px;
  }
`;

const InputWrapper = styled.div`
  & > :not(:last-child) {
    margin-bottom: 8px;
  }
`;

const StyledInputWithLabel = styled(InputWithLabel)`
  margin-bottom: 0;
`;

const StyleMessage = styled(Message)`
  margin-inline: 15px;
`;

export default EditPassword;
