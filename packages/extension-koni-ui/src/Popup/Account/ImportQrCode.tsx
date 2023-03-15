// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import ChainLogoMap from '@subwallet/extension-koni-ui/assets/logo';
import { Layout } from '@subwallet/extension-koni-ui/components';
import CloseIcon from '@subwallet/extension-koni-ui/components/Icon/CloseIcon';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import DualLogo from '@subwallet/extension-koni-ui/components/Logo/DualLogo';
import QrScannerErrorNotice from '@subwallet/extension-koni-ui/components/Qr/Scanner/ErrorNotice';
import { IMPORT_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useCompleteCreateAccount from '@subwallet/extension-koni-ui/hooks/account/useCompleteCreateAccount';
import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useGoBackFromCreateAccount from '@subwallet/extension-koni-ui/hooks/account/useGoBackFromCreateAccount';
import useOpenQrScanner from '@subwallet/extension-koni-ui/hooks/qr/useOpenQrScanner';
import useAutoNavigateToCreatePassword from '@subwallet/extension-koni-ui/hooks/router/autoNavigateToCreatePassword';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { checkPublicAndPrivateKey, createAccountWithSecret } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { QrAccount, ScannerResult } from '@subwallet/extension-koni-ui/types/scanner';
import { ValidateState } from '@subwallet/extension-koni-ui/types/validator';
import { importQrScan } from '@subwallet/extension-koni-ui/util/scanner/attach';
import { Form, Icon, Image, ModalContext, SwQrScanner } from '@subwallet/react-ui';
import CN from 'classnames';
import { QrCode, Scan } from 'phosphor-react';
import React, { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps

const FooterIcon = (
  <Icon
    phosphorIcon={QrCode}
    weight='fill'
  />
);

const checkAccount = (qrAccount: QrAccount): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    checkPublicAndPrivateKey(qrAccount.genesisHash, qrAccount.content)
      .then(({ isEthereum, isValid }) => {
        if (isValid) {
          resolve(isEthereum);
        } else {
          reject(new Error('Invalid qr'));
        }
      })
      .catch((e: Error) => {
        reject(e);
      });
  });
};

const modalId = 'import-qr-code-scanner-modal';

const Component: React.FC<Props> = (props: Props) => {
  useAutoNavigateToCreatePassword();

  const { className } = props;
  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();

  const accountName = useGetDefaultAccountName();
  const onComplete = useCompleteCreateAccount();
  const onBack = useGoBackFromCreateAccount(IMPORT_ACCOUNT_MODAL);

  const { inactiveModal } = useContext(ModalContext);

  const [validateState, setValidateState] = useState<ValidateState>({});
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<QrAccount | null>(null);

  const handleResult = useCallback((val: string): QrAccount | null => {
    const result = importQrScan(val);

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
    inactiveModal(modalId);
    setValidateState({
      message: '',
      status: 'success'
    });

    if (_account && JSON.stringify(account) !== JSON.stringify(_account)) {
      setAccount(_account);

      setTimeout(() => {
        checkAccount(_account)
          .then((isEthereum) => {
            createAccountWithSecret({ name: accountName,
              isAllow: true,
              secretKey: _account.content,
              publicKey: _account.genesisHash,
              isEthereum: isEthereum })
              .then(({ errors, success }) => {
                if (success) {
                  setValidateState({});
                  onComplete();
                } else {
                  setValidateState({
                    message: errors[0].message,
                    status: 'error'
                  });
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
          })
          .catch((error: Error) => {
            setValidateState({
              message: error.message,
              status: 'error'
            });
          });
      }, 300);
    } else {
      setLoading(false);
    }
  }, [account, accountName, onComplete, inactiveModal]);

  const openCamera = useOpenQrScanner(modalId);

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
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={{
          children: loading ? t('Creating') : t('Scan the QR code'),
          icon: FooterIcon,
          onClick: openCamera,
          loading: loading
        }}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={t('Import your wallet by QR')}
      >
        <div className={CN(className, 'container')}>
          <div className='sub-title'>
            {t('Please make sure that you have granted SubWallet the access to your device\'s camera.')}
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
              linkIcon={(
                <Icon
                  phosphorIcon={Scan}
                  size='md'
                />
              )}
              rightLogo={(
                <Image
                  height={56}
                  shape='squircle'
                  src={ChainLogoMap.subwallet}
                  width={56}
                />
              )}
            />
          </div>
          <div className='instruction'>
            <div className='instruction'>
              <span>{t('Click the "Scan the QR code" button, or read ')}&nbsp;</span>
              <a
                className='link'
                href='#'
              >
                {t('this instructions')}
              </a>
              <span>,&nbsp;</span>
              <span>{t('for more details.')}</span>
            </div>
          </div>
          <Form.Item
            help={validateState.message}
            validateStatus={validateState.status}
          />
          <SwQrScanner
            className={className}
            id={modalId}
            isError={!!validateState.status}
            onError={onError}
            onSuccess={onSuccess}
            overlay={validateState.message && (<QrScannerErrorNotice message={validateState.message} />)}
          />
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const ImportQrCode = styled(Component)<Props>(({ theme: { token } }: Props) => {
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
      color: token.colorLink,
      textDecoration: 'underline'
    }
  };
});

export default ImportQrCode;
