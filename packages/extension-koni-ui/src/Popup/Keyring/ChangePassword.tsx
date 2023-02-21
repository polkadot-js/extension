// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { renderBaseConfirmPasswordRules, renderBasePasswordRules } from '@subwallet/extension-koni-ui/constants/rules';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { keyringChangeMasterPassword } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Form, Icon, Input } from '@subwallet/react-ui';
import PageIcon from '@subwallet/react-ui/es/page-icon';
import CN from 'classnames';
import { Info, ShieldCheck } from 'phosphor-react';
import { Callbacks, FieldData } from 'rc-field-form/lib/interface';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

enum FormFieldName {
  PASSWORD = 'password',
  OLD_PASSWORD = 'old_password',
  CONFIRM_PASSWORD = 'confirm_password',
}

interface ChangePasswordFormState {
  [FormFieldName.PASSWORD]: string;
  [FormFieldName.OLD_PASSWORD]: string;
  [FormFieldName.CONFIRM_PASSWORD]: string;
}

const newPasswordRules = renderBasePasswordRules('New password');
const confirmPasswordRules = renderBaseConfirmPasswordRules(FormFieldName.PASSWORD);

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form] = Form.useForm<ChangePasswordFormState>();
  const [isDisabled, setIsDisable] = useState(true);
  const [submitError, setSubmitError] = useState('');

  const [loading, setLoading] = useState(false);

  const onSubmit: Callbacks<ChangePasswordFormState>['onFinish'] = useCallback((values: ChangePasswordFormState) => {
    const password = values[FormFieldName.PASSWORD];
    const oldPassword = values[FormFieldName.OLD_PASSWORD];

    if (password && oldPassword) {
      setLoading(true);
      keyringChangeMasterPassword({
        createNew: true,
        newPassword: password,
        oldPassword: oldPassword
      }).then((res) => {
        if (!res.status) {
          setSubmitError(res.errors[0]);
        } else {
          navigate('/home');
        }
      }).catch((e: Error) => {
        setSubmitError(e.message);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [navigate]);

  const onUpdate: Callbacks<ChangePasswordFormState>['onFieldsChange'] = useCallback((changedFields: FieldData[], allFields: FieldData[]) => {
    const error = allFields.map((data) => data.errors || [])
      .reduce((old, value) => [...old, ...value])
      .some((value) => !!value);

    const empty = allFields.map((data) => data.value as unknown).some((value) => !value);

    setSubmitError('');
    setIsDisable(error || empty);
  }, []);

  const onChangePassword = useCallback(() => {
    const confirmPassword = form.getFieldValue(FormFieldName.CONFIRM_PASSWORD) as string;

    if (confirmPassword) {
      // eslint-disable-next-line no-void
      void form.validateFields([FormFieldName.CONFIRM_PASSWORD]);
    }
  }, [form]);

  return (
    <Layout.Base
      className={CN(className)}
      footerButton={{
        children: t('Save'),
        onClick: form.submit,
        loading: loading,
        disabled: isDisabled
      }}
      showBackButton={true}
      showSubHeader={true}
      subHeaderBackground='transparent'
      subHeaderCenter={true}
      subHeaderIcons={[
        {
          icon: (
            <Icon
              phosphorIcon={Info}
              type='phosphor'
            />
          )
        }
      ]}
      subHeaderPaddingVertical={true}
      title={t('Change password')}
    >
      <div className='body-container'>
        <div className='page-icon'>
          <PageIcon
            color='var(--page-icon-color)'
            iconProps={{
              weight: 'fill',
              phosphorIcon: ShieldCheck
            }}
          />
        </div>
        <div className='title'>
          {t('Change your password')}
        </div>
        <Form
          form={form}
          initialValues={{
            [FormFieldName.OLD_PASSWORD]: '',
            [FormFieldName.PASSWORD]: '',
            [FormFieldName.CONFIRM_PASSWORD]: ''
          }}
          name='create-password-form'
          onFieldsChange={onUpdate}
          onFinish={onSubmit}
        >
          <Form.Item
            className='form-item-no-error'
            name={FormFieldName.OLD_PASSWORD}
            rules={[
              {
                message: 'Password is required',
                required: true
              }
            ]}
          >
            <Input
              placeholder={t('Current password')}
              type='password'
            />
          </Form.Item>
          <Form.Item
            className='form-item-no-error'
            name={FormFieldName.PASSWORD}
            rules={newPasswordRules}
          >
            <Input
              onChange={onChangePassword}
              placeholder={t('New password')}
              type='password'
            />
          </Form.Item>
          <Form.Item
            className='form-item-no-error'
            name={FormFieldName.CONFIRM_PASSWORD}
            rules={confirmPasswordRules}
          >
            <Input
              placeholder={t('Confirm new password')}
              type='password'
            />
          </Form.Item>
          <Form.Item
            help={submitError}
            validateStatus={submitError && 'error'}
          />
        </Form>
      </div>
    </Layout.Base>
  );
};

const ChangePassword = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      padding: `0 ${token.padding}px`,
      textAlign: 'center',

      '.page-icon': {
        display: 'flex',
        justifyContent: 'center',
        marginTop: token.margin,
        '--page-icon-color': token.colorSecondary
      },

      '.title': {
        marginTop: token.margin,
        marginBottom: token.margin * 2,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading3,
        lineHeight: token.lineHeightHeading3,
        color: token.colorTextBase
      },

      '.form-item-no-error': {
        '.ant-form-item-explain': {
          display: 'none'
        }
      }
    }
  };
});

export default ChangePassword;
