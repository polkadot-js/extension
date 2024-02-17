// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseModal } from '@subwallet/extension-web-ui/components';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { keyringUnlock } from '@subwallet/extension-web-ui/messaging';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-web-ui/types';
import { simpleCheckForm } from '@subwallet/extension-web-ui/utils';
import { Button, Form, Input, ModalContext, SwIconProps } from '@subwallet/react-ui';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import useFocusById from '../../hooks/form/useFocusById';

export type ActionItemType = {
  key: string,
  icon: SwIconProps['phosphorIcon'],
  iconBackgroundColor: string,
  title: string,
  onClick?: () => void
};

type Props = ThemeProps

export const UNLOCK_MODAL_ID = 'unlock-modal';

const passwordInputId = 'login-password';

enum FormFieldName {
  PASSWORD = 'password'
}

interface LoginFormState {
  [FormFieldName.PASSWORD]: string;
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { checkActive, inactiveModal } = useContext(ModalContext);
  const isLocked = useSelector((state: RootState) => state.accountState.isLocked);
  const [form] = Form.useForm<LoginFormState>();
  const [loading, setLoading] = useState(false);
  const [isDisable, setIsDisable] = useState(true);
  const { isWebUI } = useContext(ScreenContext);

  const closeModal = useCallback(
    () => {
      form.resetFields();
      inactiveModal(UNLOCK_MODAL_ID);
    },
    [form, inactiveModal]
  );

  // Auto close modal if unlocked
  useEffect(() => {
    if (!isLocked && checkActive(UNLOCK_MODAL_ID)) {
      inactiveModal(UNLOCK_MODAL_ID);
    }
  }, [checkActive, inactiveModal, isLocked]);

  const onUpdate: FormCallbacks<LoginFormState>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { empty, error } = simpleCheckForm(allFields);

    setIsDisable(error || empty);
  }, []);

  const onError = useCallback((error: string) => {
    form.setFields([{ name: FormFieldName.PASSWORD, errors: [error] }]);
    (document.getElementById(passwordInputId) as HTMLInputElement)?.select();
  }, [form]);

  const onSubmit: FormCallbacks<LoginFormState>['onFinish'] = useCallback((values: LoginFormState) => {
    setLoading(true);
    setTimeout(() => {
      keyringUnlock({
        password: values[FormFieldName.PASSWORD]
      })
        .then((data) => {
          if (!data.status) {
            onError(data.errors[0]);
          }
        })
        .catch((e: Error) => {
          onError(e.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 500);
  }, [onError]);

  useFocusById(passwordInputId);

  return (
    <BaseModal
      center={true}
      className={className}
      id={UNLOCK_MODAL_ID}
      onCancel={closeModal}
      title={t('Enter Password')}
      zIndex={9999}
    >
      <div className='body-container'>
        <Form
          form={form}
          initialValues={{ [FormFieldName.PASSWORD]: '' }}
          onFieldsChange={onUpdate}
          onFinish={onSubmit}
        >
          <Form.Item
            name={FormFieldName.PASSWORD}
            rules={[
              {
                message: t('Password is required'),
                required: true
              }
            ]}
            statusHelpAsTooltip={isWebUI}
          >
            <Input.Password
              containerClassName='password-input'
              id={passwordInputId}
              placeholder={t('Password')}
            />
          </Form.Item>
          <Form.Item>
            <Button
              block={true}
              disabled={isDisable}
              htmlType='submit'
              loading={loading}
            >
              {t('Unlock')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </BaseModal>
  );
}

export const UnlockModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.__action-item + .__action-item': {
      marginTop: token.marginXS
    },

    '.ant-sw-modal-body': {
      paddingBottom: 0
    }
  });
});
