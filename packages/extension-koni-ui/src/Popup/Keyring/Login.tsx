// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import LoginBg from '@subwallet/extension-koni-ui/assets/WelcomeBg.png';
import { Layout } from '@subwallet/extension-koni-ui/components';
import Logo3D from '@subwallet/extension-koni-ui/components/Logo/Logo3D';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { keyringUnlock } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { FormCallbacks, FormFieldData } from '@subwallet/extension-koni-ui/types/form';
import { simpleCheckForm } from '@subwallet/extension-koni-ui/util/validators/form';
import { Button, Form, Input } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

type Props = ThemeProps

enum FormFieldName {
  PASSWORD = 'password'
}

interface LoginFormState {
  [FormFieldName.PASSWORD]: string;
}

const passwordInputId = 'login-password';

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();

  const [form] = Form.useForm<LoginFormState>();

  const [loading, setLoading] = useState(false);
  const [isDisable, setIsDisable] = useState(true);

  const onUpdate: FormCallbacks<LoginFormState>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { empty, error } = simpleCheckForm(changedFields, allFields);

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

  // Auto focus to password field
  useEffect(() => {
    (form.getFieldInstance('password') as HTMLInputElement).focus();
  }, [form]);

  return (
    <Layout.Base
      className={CN(className)}
    >
      <div className='bg-gradient' />
      <div className='bg-image' />
      <div className='body-container'>
        <div className='logo-container'>
          <Logo3D />
        </div>
        <div className='title'>
          {t('Welcome back!')}
        </div>
        <div className='sub-title'>
          {t('Enter your password to unlock account')}
        </div>
        <Form
          form={form}
          initialValues={{ [FormFieldName.PASSWORD]: '' }}
          onFieldsChange={onUpdate}
          onFinish={onSubmit}
        >
          <Form.Item
            hideError={true}
            name={FormFieldName.PASSWORD}
            rules={[
              {
                message: 'Password is required',
                required: true
              }
            ]}
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
          <Form.Item>
            <div className='forgot-password'>
              {t('Forgot password')}
            </div>
          </Form.Item>
        </Form>
      </div>
    </Layout.Base>
  );
};

const Login = styled(Component)<Props>(({ theme }: Props) => {
  const { token } = theme;

  return {
    position: 'relative',

    '.bg-gradient': {
      backgroundImage: 'linear-gradient(180deg, rgba(0, 75, 255, 0.1) 16.47%, rgba(217, 217, 217, 0) 94.17%)',
      height: '100%',
      width: '100%',
      position: 'absolute',
      left: 0,
      top: 0
    },

    '.bg-image': {
      backgroundImage: `url(${LoginBg})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'top',
      backgroundSize: 'contain',
      height: '100%',
      position: 'absolute',
      width: '100%',
      left: 0,
      top: 0,
      opacity: 0.1
    },

    '.body-container': {
      padding: `0 ${token.padding}px`,
      textAlign: 'center',

      '.logo-container': {
        paddingTop: token.paddingXL * 3.25,
        color: token.colorTextBase
      },

      '.title': {
        marginTop: token.margin,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading3,
        lineHeight: token.lineHeightHeading3,
        color: token.colorTextBase
      },

      '.sub-title': {
        marginTop: token.marginXS,
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextLight3
      },

      '.password-input': {
        marginTop: token.marginLG * 3
      },

      '.forgot-password': {
        cursor: 'pointer',
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextLight4
      }
    }
  };
});

export default Login;
