// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import AlertBox from '@subwallet/extension-koni-ui/components/Alert';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { keyringChangeMasterPassword } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Form, Icon, Input } from '@subwallet/react-ui';
import PageIcon from '@subwallet/react-ui/es/page-icon';
import CN from 'classnames';
import { CheckCircle, Question, ShieldPlus } from 'phosphor-react';
import { Callbacks, FieldData } from 'rc-field-form/lib/interface';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

enum FormFieldName {
  PASSWORD = 'password',
  CONFIRM_PASSWORD = 'confirm_password',
}

interface CreatePasswordFormState {
  [FormFieldName.PASSWORD]: string;
  [FormFieldName.CONFIRM_PASSWORD]: string;
}

const MinPassword = 6;

const FooterIcon = (
  <Icon
    customSize={'28px'}
    phosphorIcon={CheckCircle}
    size='sm'
    weight='fill'
  />
);

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form] = Form.useForm<CreatePasswordFormState>();
  const [isDisabled, setIsDisable] = useState(true);
  const [submitError, setSubmitError] = useState('');

  const [loading, setLoading] = useState(false);

  const onSubmit: Callbacks<CreatePasswordFormState>['onFinish'] = useCallback((values: CreatePasswordFormState) => {
    const password = values[FormFieldName.PASSWORD];

    if (password) {
      setLoading(true);
      keyringChangeMasterPassword({
        createNew: true,
        newPassword: password
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

  const onUpdate: Callbacks<CreatePasswordFormState>['onFieldsChange'] = useCallback((changedFields: FieldData[], allFields: FieldData[]) => {
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
      void form.validateFields([FormFieldName.CONFIRM_PASSWORD]);
    }
  }, [form]);

  return (
    <Layout.Base
      className={CN(className)}
      footerButton={{
        children: t('Continue'),
        onClick: form.submit,
        loading: loading,
        disabled: isDisabled,
        icon: FooterIcon
      }}
      showBackButton={true}
      showSubHeader={true}
      subHeaderBackground='transparent'
      subHeaderCenter={true}
      subHeaderIcons={[
        {
          icon: (
            <Icon
              phosphorIcon={Question}
              type='phosphor'
            />
          )
        }
      ]}
      subHeaderPaddingVertical={true}
      title={t('Create a password')}
    >
      <div className='body-container'>
        <div className='page-icon'>
          <PageIcon
            color='var(--page-icon-color)'
            iconProps={{
              weight: 'fill',
              phosphorIcon: ShieldPlus
            }}
          />
        </div>
        <div className='title'>
          {t('Create a password')}
        </div>
        <Form
          form={form}
          initialValues={{
            [FormFieldName.PASSWORD]: '',
            [FormFieldName.CONFIRM_PASSWORD]: ''
          }}
          name='create-password-form'
          onFieldsChange={onUpdate}
          onFinish={onSubmit}
        >
          <Form.Item
            className='form-item-no-error'
            name={FormFieldName.PASSWORD}
            rules={[
              {
                message: 'Password is too short',
                min: MinPassword
              },
              {
                message: 'Password is required',
                required: true
              }
            ]}
          >
            <Input
              containerClassName='password-input'
              onChange={onChangePassword}
              placeholder={t('Enter password')}
              type='password'
            />
          </Form.Item>
          <Form.Item
            className='form-item-no-error'
            name={FormFieldName.CONFIRM_PASSWORD}
            rules={[
              {
                message: 'Confirm password is required',
                required: true
              },
              ({ getFieldValue }) => ({
                validator: (_, value) => {
                  const password = getFieldValue(FormFieldName.PASSWORD) as string;

                  if (!value || password === value) {
                    return Promise.resolve();
                  }

                  return Promise.reject(new Error('Passwords do not match!'));
                }
              })
            ]}
          >
            <Input
              containerClassName='password-input'
              placeholder={t('Confirm password')}
              type='password'
            />
          </Form.Item>
          <Form.Item>
            <AlertBox
              description={t('Recommended security practice')}
              title={t('Always choose a strong password!')}
              type='warning'
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

const CreatePassword = styled(Component)<Props>(({ theme }: Props) => {
  const { token } = theme;

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

      '.forgot-password': {
        cursor: 'pointer',
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextLight4
      },

      '.form-item-no-error': {
        '.ant-form-item-explain': {
          display: 'none'
        }
      }
    }
  };
});

export default CreatePassword;
