// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import CloseIcon from '@subwallet/extension-koni-ui/components/Icon/CloseIcon';
import DualLogo from '@subwallet/extension-koni-ui/components/Logo/DualLogo';
import QrScannerErrorNotice from '@subwallet/extension-koni-ui/components/Qr/Scanner/ErrorNotice';
import { ATTACH_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useCompleteCreateAccount from '@subwallet/extension-koni-ui/hooks/account/useCompleteCreateAccount';
import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useGoBackFromCreateAccount from '@subwallet/extension-koni-ui/hooks/account/useGoBackFromCreateAccount';
import useScanAccountQr from '@subwallet/extension-koni-ui/hooks/qr/useScanAccountQr';
import useAutoNavigateToCreatePassword from '@subwallet/extension-koni-ui/hooks/router/useAutoNavigateToCreatePassword';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { createAccountExternalV2 } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps, ValidateState } from '@subwallet/extension-koni-ui/types';
import { QrAccount } from '@subwallet/extension-koni-ui/types/scanner';
import { qrSignerScan } from '@subwallet/extension-koni-ui/utils/scanner/attach';
import { Button, Form, Icon, Image, ModalContext, SwQrScanner } from '@subwallet/react-ui';
import CN from 'classnames';
import { QrCode } from 'phosphor-react';
import React, { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ChainLogoMap from '../../../assets/logo';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';

const FooterIcon = (
  <Icon
    phosphorIcon={QrCode}
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

const modalId = 'attach-qr-signer-scanner-modal';

const Component: React.FC<Props> = (props: Props) => {
  useAutoNavigateToCreatePassword();

  const { className, description, instructionUrl, logoUrl, subTitle, title } = props;
  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();

  const onComplete = useCompleteCreateAccount();
  const onBack = useGoBackFromCreateAccount(ATTACH_ACCOUNT_MODAL);

  const accountName = useGetDefaultAccountName();
  const { inactiveModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);

  const [validateState, setValidateState] = useState<ValidateState>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback((account: QrAccount) => {
    setLoading(true);
    inactiveModal(modalId);
    setValidateState({
      message: '',
      status: 'validating'
    });

    setTimeout(() => {
      createAccountExternalV2({
        name: accountName,
        address: account.content,
        genesisHash: '',
        isEthereum: account.isEthereum,
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
            setValidateState({});
            onComplete();
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
    }, 300);
  }, [accountName, onComplete, inactiveModal]);

  const { onClose, onError, onSuccess, openCamera } = useScanAccountQr(modalId, qrSignerScan, setValidateState, onSubmit);

  const buttonProps = {
    children: loading ? t('Creating') : t('Scan the QR code'),
    icon: FooterIcon,
    onClick: openCamera,
    loading: loading
  }

  return (
    <PageWrapper className={CN(className)}>
      <Layout.Base
        onBack={onBack}
        {...(!isWebUI ? {
          rightFooterButton: buttonProps,
          showBackButton: true,
          subHeaderPaddingVertical: true,
          showSubHeader: true,
          subHeaderCenter: true,
          subHeaderBackground: 'transparent'
        }: {
          headerList: ['Simple'],
          showWebHeader: true
        })}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={title}
      >
        <div className={CN('container', {
          '__web-ui': isWebUI
        })}>
          <div className='sub-title'>
            {subTitle}
          </div>
          <div className='logo'>
            <DualLogo
              leftLogo={(
                <Image
                  height={56}
                  shape='squircle'
                  src={ChainLogoMap.subwallet}
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
            id={modalId}
            isError={!!validateState.status}
            onClose={onClose}
            onError={onError}
            onSuccess={onSuccess}
            overlay={validateState.message && (<QrScannerErrorNotice message={validateState.message} />)}
          />

          {isWebUI && (
            <Button {...buttonProps} className='action'/>
          )}
        </div>
      </Layout.Base>
    </PageWrapper>
  );
};

const ConnectQrSigner = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__web-ui': {
      maxWidth: '50%',
      margin: '0 auto',
    },
    '.container': {
      padding: token.padding,

      '& .ant-btn': {
        width: '100%',
        marginTop: 36
      }
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
