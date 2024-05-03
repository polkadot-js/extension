// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, Layout, QrScannerErrorNotice, WalletConnect } from '@subwallet/extension-koni-ui/components';
import { TIME_OUT_RECORD } from '@subwallet/extension-koni-ui/constants';
import { useDefaultNavigate, useOpenQrScanner } from '@subwallet/extension-koni-ui/hooks';
import { addConnection } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ScannerResult } from '@subwallet/extension-koni-ui/types/scanner';
import { noop, validWalletConnectUri } from '@subwallet/extension-koni-ui/utils';
import { Button, Form, Icon, Input, ModalContext, PageIcon, SwModal, SwQrScanner } from '@subwallet/react-ui';
import CN from 'classnames';
import { Scan, XCircle } from 'phosphor-react';
import { RuleObject } from 'rc-field-form/lib/interface';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps;

interface AddConnectionFormState {
  uri: string;
}

const DEFAULT_FORM_VALUES: AddConnectionFormState = {
  uri: ''
};

const faqUrl = 'https://docs.subwallet.app/main/extension-user-guide/faqs#i-see-connection-unsuccessful-pop-up-when-connecting-to-dapp-via-walletconnect';
const modalId = 'WALLET_CONNECT_CONFIRM_MODAL';
const scannerId = 'connect-connection-scanner-modal';
const showScanner = true;
const keyRecords = 'unsuccessful_connect_wc_modal';
let idTimeOut: NodeJS.Timeout;

const getTimeOutRecords = () => {
  return JSON.parse(localStorage.getItem(TIME_OUT_RECORD) || '{}') as Record<string, number>;
};

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();
  const { token } = useTheme() as Theme;

  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const [, setTimeOutRecords] = useLocalStorage(TIME_OUT_RECORD, {});
  const [form] = Form.useForm<AddConnectionFormState>();

  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState('');

  const reOpenModalWhenTimeOut = useCallback(() => {
    const timeOutRecord = getTimeOutRecords();

    if (timeOutRecord[keyRecords]) {
      setLoading(false);
      activeModal(modalId);
    }
  }, [activeModal]);

  useEffect(() => {
    const timeOutRecord = getTimeOutRecords();

    if (loading && !checkActive(modalId) && !timeOutRecord[keyRecords]) {
      idTimeOut = setTimeout(reOpenModalWhenTimeOut, 20000);
      setTimeOutRecords({ ...timeOutRecord, [keyRecords]: idTimeOut });
    } else if (timeOutRecord[keyRecords]) {
      setLoading(false);
    }
  }, [checkActive, loading, reOpenModalWhenTimeOut, setTimeOutRecords]);

  const onClickToFAQ = useCallback((isDismiss: boolean) => {
    return () => {
      const timeOutRecord = getTimeOutRecords();

      clearTimeout(idTimeOut);
      delete timeOutRecord[keyRecords];
      !isDismiss && window.open(faqUrl, '_blank');
      inactiveModal(modalId);
      form.setFieldValue('uri', DEFAULT_FORM_VALUES.uri);
      setTimeOutRecords(timeOutRecord);
    };
  }, [form, inactiveModal, setTimeOutRecords]);

  const footerModalWC = useMemo(() => {
    return (
      <div className={'__footer-wc-modal'}>
        <Button
          block={true}
          onClick={onClickToFAQ(true)}
          schema={'secondary'}
        >{t('Dismiss')}</Button>
        <Button
          block={true}
          onClick={onClickToFAQ(false)}
        >{t('Review guide')}</Button>
      </div>
    );
  }, [onClickToFAQ, t]);

  const onConnect = useCallback((uri: string) => {
    setLoading(true);

    addConnection({
      uri
    })
      .then(noop)
      .catch((e) => {
        console.error(e);
        setLoading(false);
        activeModal(modalId);
      });
  }, [activeModal]);

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
      <SwModal
        className={className}
        closable={true}
        footer={footerModalWC}
        id={modalId}
        onCancel={onClickToFAQ(true)}
        title={t('Connection unsuccessful')}
      >
        <div className='__wc-modal-container'>
          <div className='page-icon'>
            <PageIcon
              color={token.colorError}
              iconProps={{
                weight: 'fill',
                phosphorIcon: XCircle
              }}
            />
          </div>
          <div className={'__wc-modal-content'}>
            {t('Connection unsuccessful. Review our user guide and try connecting again.')}
          </div>
        </div>
      </SwModal>
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
    '.__wc-modal-container': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: -token.margin
    },

    '.__wc-modal-content': {
      color: token.colorTextTertiary,
      padding: '0 16px',
      textAlign: 'center',
      marginTop: token.marginMD
    },

    '.ant-sw-modal-footer': {
      borderTop: 0,
      '.__footer-wc-modal': {
        display: 'flex'
      }
    }

  };
});

export default ConnectWalletConnect;
