// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import QrScannerErrorNotice from '@subwallet/extension-koni-ui/components/Qr/Scanner/ErrorNotice';
import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useAutoNavigateToCreatePassword from '@subwallet/extension-koni-ui/hooks/router/autoNavigateToCreatePassword';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { createAccountExternalV2 } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ValidateState } from '@subwallet/extension-koni-ui/types/validator';
import { readOnlyScan } from '@subwallet/extension-koni-ui/util/scanner/attach';
import { Button, Form, Icon, Input, ModalContext, SwQrScanner } from '@subwallet/react-ui';
import PageIcon from '@subwallet/react-ui/es/page-icon';
import { ScannerResult } from '@subwallet/react-ui/es/sw-qr-scanner';
import CN from 'classnames';
import { Eye, Info, QrCode } from 'phosphor-react';
import React, { ChangeEventHandler, useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps

const FooterIcon = (
  <Icon
    phosphorIcon={Eye}
    weight='fill'
  />
);

const modalId = 'attach-read-only-scanner-modal';

const Component: React.FC<Props> = ({ className }: Props) => {
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const [address, setAddress] = useState('');
  const [reformatAddress, setReformatAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEthereum, setIsEthereum] = useState(false);
  const [scanningError, setScanningError] = useState(false);
  const [validateState, setValidateState] = useState<ValidateState>({});
  const accountName = useGetDefaultAccountName();

  const handleResult = useCallback((val: string): boolean => {
    const result = readOnlyScan(val);

    if (result) {
      setReformatAddress(result.content);
      setIsEthereum(result.isEthereum);
      setValidateState({});

      return true;
    } else {
      setScanningError(true);
      setReformatAddress('');
      setValidateState({
        message: 'Invalid address',
        status: 'error'
      });

      return false;
    }
  }, []);

  const onChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    const val = event.target.value;

    setAddress(val);
    handleResult(val);
  }, [handleResult]);

  const openCamera = useCallback(() => {
    setScanningError(false);
    activeModal(modalId);
  }, [activeModal]);

  const closeCamera = useCallback(() => {
    setScanningError(false);
  }, []);

  const onSuccess = useCallback((result: ScannerResult) => {
    const rs = handleResult(result.text);

    if (rs) {
      inactiveModal(modalId);
      setAddress(result.text);
    }
  }, [handleResult, inactiveModal]);

  const onError = useCallback((error: string) => {
    setReformatAddress('');
    setValidateState({
      message: error,
      status: 'error'
    });
  }, []);

  const onSubmit = useCallback(() => {
    setLoading(true);

    if (reformatAddress) {
      createAccountExternalV2({
        name: accountName,
        address: reformatAddress,
        genesisHash: '',
        isEthereum: isEthereum,
        isAllowed: false,
        isReadOnly: true
      })
        .then((errors) => {
          if (errors.length) {
            setValidateState({
              message: errors[0].message,
              status: 'error'
            });
          } else {
            setValidateState({});
            goHome();
          }
        })
        .catch((error: Error) => {
          setValidateState({
            message: error.message,
            status: 'error'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [reformatAddress, accountName, isEthereum, goHome]);

  return (
    <Layout.Base
      rightFooterButton={{
        children: t('Attach read-only account'),
        icon: FooterIcon,
        disabled: !reformatAddress || !!validateState.status,
        onClick: onSubmit,
        loading: loading
      }}
      showBackButton={true}
      showSubHeader={true}
      subHeaderBackground='transparent'
      subHeaderCenter={true}
      subHeaderIcons={[
        {
          icon: (
            <Icon
              phosphorIcon={Info}
              size='sm'
            />
          )
        }
      ]}
      subHeaderPaddingVertical={true}
      title={t<string>('Attach watch-only account')}
    >
      <div className={CN(className, 'container')}>
        <div className='description'>
          {t('Track the activity of any wallet without injecting your private key to SubWallet')}
        </div>
        <div className='page-icon'>
          <PageIcon
            color='var(--page-icon-color)'
            iconProps={{
              weight: 'fill',
              phosphorIcon: Eye
            }}
          />
        </div>
        <Form>
          <Form.Item validateStatus={validateState.status}>
            <Input
              label={t('Account address')}
              onChange={onChange}
              placeholder={t('Please type or paste account address')}
              suffix={(
                <Button
                  icon={(
                    <Icon
                      phosphorIcon={QrCode}
                      size='sm'
                    />
                  )}
                  onClick={openCamera}
                  size='xs'
                  type='ghost'
                />
              )}
              value={address}
            />
          </Form.Item>
          <Form.Item
            help={validateState.message}
            validateStatus={validateState.status}
          />
        </Form>

        <SwQrScanner
          className={className}
          id={modalId}
          isError={!!validateState.status && scanningError}
          onClose={closeCamera}
          onError={onError}
          onSuccess={onSuccess}
          overlay={scanningError && validateState.message && (<QrScannerErrorNotice message={validateState.message} />)}
        />
      </div>
    </Layout.Base>
  );
};

const AttachReadOnly = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.container': {
      padding: token.padding
    },

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
      '--page-icon-color': token.colorSecondary
    }
  };
});

export default AttachReadOnly;
