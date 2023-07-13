// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, Layout, QrScannerErrorNotice, WalletConnect } from '@subwallet/extension-koni-ui/components';
import { useDefaultNavigate, useNotification, useOpenQrScanner } from '@subwallet/extension-koni-ui/hooks';
import { addConnection } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ScannerResult } from '@subwallet/extension-koni-ui/types/scanner';
import { validWalletConnectUri } from '@subwallet/extension-koni-ui/utils';
import { Button, Form, Icon, Input, ModalContext, PageIcon, SwQrScanner } from '@subwallet/react-ui';
import CN from 'classnames';
import { Scan } from 'phosphor-react';
import { RuleObject } from 'rc-field-form/lib/interface';
import React, { SyntheticEvent, useCallback, useContext, useState } from 'react';
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
const showScanner = true;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const notification = useNotification();
  const { goHome } = useDefaultNavigate();

  const { inactiveModal } = useContext(ModalContext);

  const [form] = Form.useForm<AddConnectionFormState>();

  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState('');

  const onConnect = useCallback((uri: string) => {
    setLoading(true);

    addConnection({
      uri
    })
      .then(() => {
        setLoading(false);
        navigate('/wallet-connect/list');
      })
      .catch((e) => {
        console.error(e);
        const errMessage = (e as Error).message;
        const message = errMessage.includes('Pairing already exists') ? t('Connection already exists') : t('Fail to add connection');

        notification({
          type: 'error',
          message: message
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
    const error = validWalletConnectUri(uri, t);

    if (!error && !loading) {
      setScanError('');
      inactiveModal(scannerId);
      form.setFieldValue('uri', result.text);
    } else {
      if (error) {
        setScanError(error);
      }
    }
  }, [loading, inactiveModal, form, t]);

  const openScanner = useOpenQrScanner(scannerId);

  const onOpenScan = useCallback((e?: SyntheticEvent) => {
    e && e.stopPropagation();
    openScanner();
  }, [openScanner]);

  const onCloseScan = useCallback(() => {
    setScanError('');
  }, []);

  const onScanError = useCallback((error: string) => {
    console.log(error);
    setScanError(error);
  }, []);

  const goBack = useCallback(() => {
    navigate('/wallet-connect/list');
  }, [navigate]);

  const uriValidator = useCallback((rule: RuleObject, uri: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const error = validWalletConnectUri(uri, t);

      if (!error) {
        resolve();
      } else {
        reject(new Error(error));
      }
    });
  }, [t]);

  return (
    <Layout.WithSubHeaderOnly
      className={CN(className)}
      onBack={goBack}
      rightFooterButton={{
        children: t('Connect'),
        onClick: form.submit,
        loading: loading,
        icon: (
          <Icon
            customIcon={(
              <WalletConnect
                height='1em'
                width='1em'
              />
            )}
            type='customIcon'
          />
        )
      }}
      subHeaderIcons={[{
        icon: <CloseIcon />,
        onClick: goHome
      }]}
      title={t('WalletConnect')}
    >
      <div className='body-container'>
        <div className='description'>
          {t('By clicking "Connect", you allow this dapp to view your public address')}
        </div>
        <div className='page-icon'>
          <PageIcon
            color='var(--page-icon-color)'
            iconProps={{
              customIcon: (
                <WalletConnect
                  height='1em'
                  width='1em'
                />
              ),
              type: 'customIcon'
            }}
          />
        </div>
        <Form
          form={form}
          initialValues={DEFAULT_FORM_VALUES}
          onFinish={onFinish}
        >
          <Form.Item
            name={'uri'}
            rules={[
              {
                required: true,
                message: t('URI is required')
              },
              {
                validator: uriValidator
              }
            ]}
            statusHelpAsTooltip={true}
          >
            <Input
              disabled={loading}
              label={t('URI')}
              placeholder={t('Please type or paste or scan URI')}
              suffix={(
                <>
                  {
                    showScanner && (
                      <Button
                        disabled={loading}
                        icon={(
                          <Icon
                            phosphorIcon={Scan}
                            size='sm'
                          />
                        )}
                        onClick={onOpenScan}
                        size='xs'
                        type='ghost'
                      />
                    )
                  }
                </>
              )}
            />
          </Form.Item>
        </Form>
        {
          showScanner && (
            <SwQrScanner
              className={className}
              id={scannerId}
              isError={!!scanError}
              onClose={onCloseScan}
              onError={onScanError}
              onSuccess={onSuccess}
              overlay={scanError && <QrScannerErrorNotice message={scanError} />}
            />
          )
        }
      </div>
    </Layout.WithSubHeaderOnly>
  );
};

const ConnectWalletConnect = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      padding: `0 ${token.padding}px`,

      '.description': {
        padding: `0 ${token.padding}px`,
        fontSize: token.fontSizeHeading6,
        lineHeight: token.lineHeightHeading6,
        color: token.colorTextDescription,
        textAlign: 'center'
      },

      '.page-icon': {
        display: 'flex',
        justifyContent: 'center',
        marginTop: token.controlHeightLG,
        marginBottom: token.sizeXXL,
        '--page-icon-color': token.colorPrimary
      },

      '.ant-input-suffix': {
        minWidth: token.sizeXS
      }
    }
  };
});

export default ConnectWalletConnect;
