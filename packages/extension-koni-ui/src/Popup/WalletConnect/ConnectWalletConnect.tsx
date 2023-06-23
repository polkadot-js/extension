// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import { useNotification } from '@subwallet/extension-koni-ui/hooks';
import { connectWalletConnect } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Form, Input } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

interface ConnectWalletFormState {
  uri: string;
}

const DEFAULT_FORM_VALUES: ConnectWalletFormState = {
  uri: ''
};

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const notification = useNotification();

  const [form] = Form.useForm<ConnectWalletFormState>();

  const [loading, setLoading] = useState(false);

  const onFinish: FormCallbacks<ConnectWalletFormState>['onFinish'] = useCallback((values: ConnectWalletFormState) => {
    const { uri } = values;

    setLoading(true);
    connectWalletConnect({
      uri
    })
      .then(() => {
        setLoading(false);
        navigate(DEFAULT_ROUTER_PATH);
      })
      .catch((e) => {
        console.error(e);
        notification({
          type: 'error',
          message: t('Fail to add connection')
        });
        setLoading(false);
      });
  }, [navigate, notification, t]);

  return (
    <Layout.WithSubHeaderOnly
      className={CN(className)}
      rightFooterButton={{
        children: t('Connect'),
        onClick: form.submit,
        loading: loading
      }}
      title={t('Connect Wallet Connect')}
    >
      <div className='body-container'>
        <Form
          form={form}
          initialValues={DEFAULT_FORM_VALUES}
          onFinish={onFinish}
        >
          <Form.Item
            name={'uri'}
            rules={[
              {
                required: true
              }
            ]}
          >
            <Input label={t('Uri')} />
          </Form.Item>
        </Form>
      </div>
    </Layout.WithSubHeaderOnly>
  );
};

const ConnectWalletConnect = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      padding: `0 ${token.padding}px`
    }
  };
});

export default ConnectWalletConnect;
