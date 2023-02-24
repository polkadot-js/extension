// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import LoginBg from '@subwallet/extension-koni-ui/assets/Login_BG.png';
import { Layout } from '@subwallet/extension-koni-ui/components';
import Logo3D from '@subwallet/extension-koni-ui/components/Logo/Logo3D';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { keyringUnlock } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { FormCallbacks, FormFieldData } from '@subwallet/extension-koni-ui/types/form';
import { simpleCheckForm } from '@subwallet/extension-koni-ui/util/validators/form';
import { Button, Form, Input } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

enum FormFieldName {
  PASSWORD = 'password'
}

interface LoginFormState {
  [FormFieldName.PASSWORD]: string;
}

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm<LoginFormState>();
  const [loading, setLoading] = useState(false);
  const [isDisable, setIsDisable] = useState(true);

  const onUpdate: FormCallbacks<LoginFormState>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { empty, error } = simpleCheckForm(changedFields, allFields);

    setIsDisable(error || empty);
  }, []);

  const onError = useCallback((error: string) => {
    form.setFields([{ name: FormFieldName.PASSWORD, errors: [error] }]);
  }, [form]);

  const onSubmit: FormCallbacks<LoginFormState>['onFinish'] = useCallback((values: LoginFormState) => {
    setLoading(true);
    setTimeout(() => {
      keyringUnlock({
        password: values[FormFieldName.PASSWORD]
      })
        .then((data) => {
          if (data.status) {
            navigate(DEFAULT_ROUTER_PATH);
          } else {
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
  }, [navigate, onError]);

  return (
    <Layout.Base
      className={CN(className)}
    >
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
            className='form-item-no-error'
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
    background: 'linear-gradient(180deg, rgba(0, 75, 255, 0.1) 16.47%, rgba(217, 217, 217, 0) 94.17%)',

    '.body-container': {
      padding: `0 ${token.padding}px`,
      textAlign: 'center',
      backgroundImage: `url(${LoginBg})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'top',

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

      '.form-item-no-error': {
        '.ant-form-item-explain': {
          display: 'none'
        }
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
