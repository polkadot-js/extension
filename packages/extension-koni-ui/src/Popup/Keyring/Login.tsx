// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import LoginBg from '@subwallet/extension-koni-ui/assets/Login_BG.png';
import { Layout } from '@subwallet/extension-koni-ui/components';
import Logo3D from '@subwallet/extension-koni-ui/components/Logo/Logo3D';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { keyringUnlock } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ValidateState } from '@subwallet/extension-koni-ui/types/validator';
import { Button, Form, Input } from '@subwallet/react-ui';
import { FormInstance } from '@subwallet/react-ui/es/form/hooks/useForm';
import CN from 'classnames';
import { Callbacks } from 'rc-field-form/lib/interface';
import React, { ChangeEventHandler, useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import {useNavigate} from "react-router-dom";

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
  const formRef = useRef<FormInstance<LoginFormState>>(null);
  const [passwordValidateState, setPasswordValidateState] = useState<ValidateState | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit: Callbacks<LoginFormState>['onFinish'] = useCallback((values: LoginFormState) => {
    setLoading(true);
    keyringUnlock({
      password: values[FormFieldName.PASSWORD]
    })
      .then((data) => {
        if (data.status) {
          console.log('Success');
          navigate('/');
        } else {
          setPasswordValidateState({
            status: 'error'
          });
        }
      })
      .catch((e: Error) => {
        setPasswordValidateState({
          status: 'error'
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const onPasswordChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    setPasswordValidateState(null);
  }, []);

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
          initialValues={{ [FormFieldName.PASSWORD]: '' }}
          onFinish={onSubmit}
          ref={formRef}
        >
          <Form.Item
            name={FormFieldName.PASSWORD}
            validateStatus={passwordValidateState?.status}
          >
            <Input.Password
              containerClassName='password-input'
              onChange={onPasswordChange}
              placeholder={t('Password')}
            />
          </Form.Item>
          <Form.Item>
            <Button
              block={true}
              disabled={!!passwordValidateState}
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
        paddingTop: 106,
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
