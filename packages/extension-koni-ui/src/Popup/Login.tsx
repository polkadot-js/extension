// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import Logo3D from '@subwallet/extension-koni-ui/components/Logo/Logo3D';
import { keyringUnlock } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ValidateState } from '@subwallet/extension-koni-ui/types/validator';
import { Button, Form, Icon, Input } from '@subwallet/react-ui';
import { FormInstance } from '@subwallet/react-ui/es/form/hooks/useForm';
import CN from 'classnames';
import { Question } from 'phosphor-react';
import { Callbacks } from 'rc-field-form/lib/interface';
import React, { ChangeEventHandler, useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

type Props = ThemeProps

enum FormFieldName {
  PASSWORD = 'password'
}

interface LoginFormState {
  [FormFieldName.PASSWORD]: string;
}

const Component: React.FC<Props> = ({ className }: Props) => {
  const formRef = useRef<FormInstance<LoginFormState>>(null);
  const [passwordValidateState, setPasswordValidateState] = useState<ValidateState | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit: Callbacks<LoginFormState>['onFinish'] = useCallback((values: LoginFormState) => {
    setLoading(true);
    keyringUnlock({
      password: values[FormFieldName.PASSWORD]
    })
      .then((data) => {
        console.log(data);

        if (data.status) {
          console.log('Success');
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
      showSubHeader={true}
      subHeaderBackground='transparent'
      subHeaderCenter={false}
      subHeaderIcons={[{ icon: <Icon
        phosphorIcon={Question}
        type='phosphor'
      /> }]}
      subHeaderPaddingVertical={true}
      title='SubWallet.App'
      withDivider={true}
    >
      <div className='body-container'>
        <div className='logo-container'>
          <Logo3D />
        </div>
        <div className='title'>
          Welcome back!
        </div>
        <div className='sub-title'>
          Enter your password to unlock account
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
            />
          </Form.Item>
          <Form.Item>
            <Button
              block={true}
              disabled={!!passwordValidateState}
              htmlType='submit'
              loading={loading}
            >
              Unlock
            </Button>
          </Form.Item>
          <Form.Item>
            <div className='forgot-password'>
              Forgot password
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
    '.body-container': {
      padding: `0 ${token.padding}px`,
      textAlign: 'center',

      '.logo-container': {
        paddingTop: token.paddingXL * 2,
        color: token.colorTextBase
      },

      '.title': {
        marginTop: token.margin,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading3,
        lineHeight: token.lineHeightHeading3,
        color: token.colorTextLight2
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
