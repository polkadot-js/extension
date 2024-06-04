// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, Layout, QrScannerErrorNotice, WalletConnect } from '@subwallet/extension-web-ui/components';
import { BaseModal } from '@subwallet/extension-web-ui/components/Modal/BaseModal';
import { WALLET_CONNECT_CREATE_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useDefaultNavigate, useNotification, useOpenQrScanner } from '@subwallet/extension-web-ui/hooks';
import { addConnection } from '@subwallet/extension-web-ui/messaging';
import { FormCallbacks, ScannerResult, ThemeProps } from '@subwallet/extension-web-ui/types';
import { validWalletConnectUri } from '@subwallet/extension-web-ui/utils';
import { Button, Form, Icon, Input, ModalContext, PageIcon, SwQrScanner } from '@subwallet/react-ui';
import { SwModalProps } from '@subwallet/react-ui/es/sw-modal/SwModal';
import CN from 'classnames';
import { Scan } from 'phosphor-react';
import { RuleObject } from 'rc-field-form/lib/interface';
import React, { SyntheticEvent, useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps & {
  isModal?: boolean;
  modalProps?: {
    closeIcon?: SwModalProps['closeIcon'],
    onCancel?: SwModalProps['onCancel'],
  };
  onAfterConnect?: () => void;
};

interface AddConnectionFormState {
  uri: string;
}

const DEFAULT_FORM_VALUES: AddConnectionFormState = {
  uri: ''
};

const scannerId = 'connect-connection-scanner-modal';
const showScanner = true;

const Component: React.FC<Props> = (props: Props) => {
  const { className, isModal, modalProps = {}, onAfterConnect } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const notification = useNotification();
  const { goHome } = useDefaultNavigate();

  const { inactiveModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);

  const [form] = Form.useForm<AddConnectionFormState>();

  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState('');

  const goBack = useCallback(() => {
    navigate('/wallet-connect/list');
  }, [navigate]);

  const _onAfterConnect = onAfterConnect || goBack;

  const onConnect = useCallback((uri: string) => {
    setLoading(true);

    addConnection({
      uri
    })
      .then(() => {
        setLoading(false);
        _onAfterConnect();
        form.resetFields();
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
  }, [_onAfterConnect, form, notification, t]);

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

  const onCloseModal = useCallback(() => {
    modalProps?.onCancel?.();
    form.resetFields();
  }, [form, modalProps]);

  const contentNode = (
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
          statusHelpAsTooltip={isWebUI}
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
            selectCameraMotion={isWebUI ? 'move-right' : undefined}
          />
        )
      }
    </div>
  );

  if (isModal) {
    return (
      <BaseModal
        className={CN(className, '-modal')}
        closeIcon={modalProps?.closeIcon}
        id={WALLET_CONNECT_CREATE_MODAL}
        onCancel={onCloseModal}
        title={t('WalletConnect')}
      >
        {contentNode}

        <div className='__footer'>
          <Button
            block={true}
            icon={
              <Icon
                customIcon={(
                  <WalletConnect
                    height='1em'
                    width='1em'
                  />
                )}
                type='customIcon'
              />
            }
            loading={loading}
            onClick={form.submit}
          >
            {t('Connect')}
          </Button>
        </div>
      </BaseModal>
    );
  }

  return (
    <Layout.WithSubHeaderOnly
      className={CN(className, 'setting-pages')}
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
      {contentNode}
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
    },

    '&.-modal': {
      '.body-container': {
        paddingLeft: 0,
        paddingRight: 0
      },

      '.page-icon': {
        marginTop: token.marginXL,
        marginBottom: token.marginXL
      },

      '.__footer': {
        paddingTop: token.paddingXS
      }
    }
  };
});

export default ConnectWalletConnect;
