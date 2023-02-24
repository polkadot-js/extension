// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import DualLogo from '@subwallet/extension-koni-ui/components/Logo/DualLogo';
import QrScannerErrorNotice from '@subwallet/extension-koni-ui/components/QrScanner/ErrorNotice';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useAutoNavigateToCreatePassword from '@subwallet/extension-koni-ui/hooks/router/autoNavigateToCreatePassword';
import { createAccountExternalV2 } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { QrAccount } from '@subwallet/extension-koni-ui/types/scanner';
import { ValidateState } from '@subwallet/extension-koni-ui/types/validator';
import { qrSignerScan } from '@subwallet/extension-koni-ui/util/scanner/attach';
import { Form, Icon, Image, SwQrScanner } from '@subwallet/react-ui';
import { ScannerResult } from '@subwallet/react-ui/es/sw-qr-scanner';
import CN from 'classnames';
import { Info, QrCode } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import LogosMap from '../../../assets/logo';

const FooterIcon = (
  <Icon
    customSize={'28px'}
    phosphorIcon={QrCode}
    size='sm'
    weight='fill'
  />
);

interface Props extends ThemeProps {
  title: string;
  subTitle: string;
  description: string;
  instructionUrl: string;
  logoUrl: string;
}

const Component: React.FC<Props> = (props: Props) => {
  useAutoNavigateToCreatePassword();

  const { className, description, instructionUrl, logoUrl, subTitle, title } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();

  const accountName = useGetDefaultAccountName();

  const [validateState, setValidateState] = useState<ValidateState>({});
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [account, setAccount] = useState<QrAccount | null>(null);

  const handleResult = useCallback((val: string): QrAccount | null => {
    const result = qrSignerScan(val);

    if (result) {
      return result;
    } else {
      setValidateState({
        message: 'Invalid address',
        status: 'error'
      });

      return null;
    }
  }, []);

  const onSubmit = useCallback((_account: QrAccount) => {
    setLoading(true);

    if (_account && JSON.stringify(account) !== JSON.stringify(_account)) {
      setAccount(_account);
      createAccountExternalV2({
        name: accountName,
        address: _account.content,
        genesisHash: '',
        isEthereum: _account.isEthereum,
        isAllowed: true,
        isReadOnly: false
      })
        .then((errors) => {
          if (errors.length) {
            setValidateState({
              message: errors[0].message,
              status: 'error'
            });
          } else {
            setVisible(false);
            setValidateState({});
            navigate(DEFAULT_ROUTER_PATH);
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
  }, [accountName, account, navigate]);

  const openCamera = useCallback(() => {
    setVisible(true);
  }, []);

  const closeCamera = useCallback(() => {
    setVisible(false);
  }, []);

  const onSuccess = useCallback((result: ScannerResult) => {
    if (!loading) {
      const rs = handleResult(result.text);

      if (rs) {
        onSubmit(rs);
      }
    }
  }, [handleResult, loading, onSubmit]);

  const onError = useCallback((error: string) => {
    setValidateState({
      message: error,
      status: 'error'
    });
  }, []);

  return (
    <Layout.Base
      rightFooterButton={{
        children: loading ? t('Creating') : t('Scan the QR code'),
        icon: FooterIcon,
        onClick: openCamera,
        loading: loading
      }}
      showBackButton={true}
      showSubHeader={true}
      subHeaderBackground='transparent'
      subHeaderCenter={true}
      subHeaderIcons={[
        {
          icon: <Icon
            phosphorIcon={Info}
            size='sm'
          />
        }
      ]}
      subHeaderPaddingVertical={true}
      title={title}
    >
      <div className={CN(className, 'container')}>
        <div className='sub-title'>
          {subTitle}
        </div>
        <div className='logo'>
          <DualLogo
            leftLogo={(
              <Image
                height={56}
                shape='squircle'
                src={LogosMap.subwallet}
                width={56}
              />
            )}
            rightLogo={(
              <Image
                height={56}
                shape='squircle'
                src={logoUrl}
                width={56}
              />
            )}
          />
        </div>
        <div className='instruction'>
          <span>{t('Follow')}&nbsp;</span>
          <a
            className='link'
            href={instructionUrl}
          >
            {t('this instructions')}
          </a>
          <span>,&nbsp;</span>
          <span>{description}</span>
        </div>
        <Form.Item
          help={validateState.message}
          validateStatus={validateState.status}
        />
        <SwQrScanner
          className={className}
          isError={!!validateState.status}
          onClose={closeCamera}
          onError={onError}
          onSuccess={onSuccess}
          open={visible}
          overlay={validateState.message && (<QrScannerErrorNotice message={validateState.message} />)}
        />
      </div>
    </Layout.Base>
  );
};

const ConnectQrSigner = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.container': {
      padding: token.padding
    },

    '.sub-title': {
      padding: `0 ${token.padding}px`,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription,
      textAlign: 'center'
    },

    '.logo': {
      margin: `${token.controlHeightLG}px 0`,
      '--logo-size': token.controlHeightLG + token.controlHeightXS
    },

    '.instruction': {
      padding: `0 ${token.padding}px`,
      marginBottom: token.margin,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription,
      textAlign: 'center'
    },

    '.link': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorLink,
      textDecoration: 'underline'
    }
  };
});

export default ConnectQrSigner;
