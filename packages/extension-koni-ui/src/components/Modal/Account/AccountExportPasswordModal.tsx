// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EXPORT_ACCOUNTS_PASSWORD_MODAL, SELECT_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useFocusById, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { exportAccountsV2 } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
import { Button, Form, Icon, Input, ModalContext, SwModal } from '@subwallet/react-ui';
import { KeyringPairs$Json } from '@subwallet/ui-keyring/types';
import { saveAs } from 'file-saver';
import { CaretLeft, CheckCircle, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps & {
  addresses?: string[]
}

const passwordInputId = 'export-password';

enum FormFieldName {
  PASSWORD = 'password'
}

interface LoginFormState {
  [FormFieldName.PASSWORD]: string;
}

const onExportJson = (jsonData: KeyringPairs$Json): (() => void) => {
  return () => {
    if (jsonData) {
      const time = Date.now();
      const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json; charset=utf-8' });

      saveAs(blob, `batch_export_${time}.json`);
    }
  };
};

function Component ({ addresses, className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { inactiveModal } = useContext(ModalContext);

  const [form] = Form.useForm<LoginFormState>();

  const [loading, setLoading] = useState(false);
  const [isDisable, setIsDisable] = useState(true);

  const closeModal = useCallback(
    () => {
      form.resetFields();
      inactiveModal(EXPORT_ACCOUNTS_PASSWORD_MODAL);
    },
    [form, inactiveModal]
  );

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
      exportAccountsV2({
        password: values[FormFieldName.PASSWORD],
        addresses: addresses
      })
        .then((data) => {
          closeModal();
          inactiveModal(SELECT_ACCOUNT_MODAL);
          navigate('/accounts/export-all-done');
          onExportJson(data.exportedJson)();
        })
        .catch((e: Error) => {
          onError(e.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 500);
  }, [addresses, closeModal, inactiveModal, navigate, onError]);

  useFocusById(passwordInputId);

  return (
    <SwModal
      className={className}
      closeIcon={(
        <Icon
          phosphorIcon={CaretLeft}
          size='md'
        />
      )}
      id={EXPORT_ACCOUNTS_PASSWORD_MODAL}
      onCancel={closeModal}
      title={t('Confirmation')}
      zIndex={9999}
    >
      <div className='body-container'>
        <Form
          form={form}
          initialValues={{ [FormFieldName.PASSWORD]: '' }}
          layout='vertical'
          onFieldsChange={onUpdate}
          onFinish={onSubmit}
        >
          <Form.Item
            className='password-form-item'
            label={t('Enter password to confirm')}
            name={FormFieldName.PASSWORD}
            rules={[
              {
                message: t('Password is required'),
                required: true
              }
            ]}
            statusHelpAsTooltip={true}
          >
            <Input.Password
              containerClassName='password-input'
              id={passwordInputId}
              placeholder={t('Password')}
            />
          </Form.Item>
          <div className='button-container'>
            <Button
              block={true}
              disabled={loading}
              icon={(
                <Icon
                  phosphorIcon={XCircle}
                  weight='fill'
                />
              )}
              onClick={closeModal}
              schema='secondary'
            >
              {t('Cancel')}
            </Button>
            <Button
              block={true}
              disabled={isDisable}
              htmlType='submit'
              icon={(
                <Icon
                  phosphorIcon={CheckCircle}
                  weight='fill'
                />
              )}
              loading={loading}
            >
              {t('Submit')}
            </Button>
          </div>
        </Form>
      </div>
    </SwModal>
  );
}

const AccountExportPasswordModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.__action-item + .__action-item': {
      marginTop: token.marginXS
    },

    '.ant-form-item-label': {
      paddingBottom: token.padding,

      label: {
        color: token.colorTextTertiary,

        '&::before': {
          display: 'none !important'
        }
      }
    },

    '.button-container': {
      display: 'flex',
      flexDirection: 'row',
      gap: token.sizeSM
    }
  });
});

export default AccountExportPasswordModal;
