// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, Layout } from '@subwallet/extension-koni-ui/components';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import { useDefaultNavigate, useNotification } from '@subwallet/extension-koni-ui/hooks';
import { addConnection } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ScannerResult } from '@subwallet/extension-koni-ui/types/scanner';
import { noop, validWalletConnectUri } from '@subwallet/extension-koni-ui/utils';
import { Form, Input, SwQrScanner } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

interface AddConnectionFormState {
  uri: string;
}

const DEFAULT_FORM_VALUES: AddConnectionFormState = {
  uri: ''
};

const scannerId = 'connect-connection-scanner-modal';

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const notification = useNotification();
  const { goHome } = useDefaultNavigate();

  const [form] = Form.useForm<AddConnectionFormState>();

  const [loading, setLoading] = useState(false);

  const onConnect = useCallback((uri: string) => {
    setLoading(true);

    addConnection({
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate, notification, t]);

  const onFinish: FormCallbacks<AddConnectionFormState>['onFinish'] = useCallback((values: AddConnectionFormState) => {
    const { uri } = values;

    onConnect(uri);
  }, [onConnect]);

  const onSuccess = useCallback((result: ScannerResult) => {
    const uri = result.text;
    const isValid = validWalletConnectUri(uri);

    if (isValid && !loading) {
      onConnect(uri);
    }
  }, [onConnect, loading]);

  const goBack = useCallback(() => {
    navigate('/wallet-connect/list');
  }, [navigate]);

  return (
    <Layout.WithSubHeaderOnly
      className={CN(className)}
      onBack={goBack}
      rightFooterButton={{
        children: t('Connect'),
        onClick: form.submit,
        loading: loading
      }}
      subHeaderIcons={[{
        icon: <CloseIcon />,
        onClick: goHome
      }]}
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
        <SwQrScanner
          className={className}
          id={scannerId}
          // isError={!!scanError}
          // onClose={onCloseScan}
          onError={noop}
          onSuccess={onSuccess}
          // overlay={scanError && <QrScannerErrorNotice message={scanError} />}
        />
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
