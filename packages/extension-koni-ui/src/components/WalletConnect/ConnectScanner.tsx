// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ADD_CONNECTION_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useNotification } from '@subwallet/extension-koni-ui/hooks';
import { addConnection } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ScannerResult } from '@subwallet/extension-koni-ui/types/scanner';
import { validWalletConnectUri } from '@subwallet/extension-koni-ui/utils';
import { Form, Input, ModalContext, SwQrScanner } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

interface AddConnectionFormState {
  uri: string;
}

const DEFAULT_FORM_VALUES: AddConnectionFormState = {
  uri: ''
};

const modalId = ADD_CONNECTION_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);

  const notification = useNotification();

  const { inactiveModal } = useContext(ModalContext);

  const [form] = Form.useForm<AddConnectionFormState>();

  const onConnect = useCallback((uri: string) => {
    setLoading(true);

    addConnection({
      uri
    })
      .then(() => {
        setLoading(false);
        inactiveModal(modalId);
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
  }, [notification, t, inactiveModal]);

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

  return (
    <SwQrScanner
      className={CN(className)}
      footer={(
        <div>
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
      )}
      id={modalId}
      onError={console.log}
      onSuccess={onSuccess}
    />
  );
};

const ConnectScanner = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default ConnectScanner;
