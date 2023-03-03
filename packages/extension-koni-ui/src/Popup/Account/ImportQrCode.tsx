// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import ChainLogoMap from '@subwallet/extension-koni-ui/assets/logo';
import { Layout } from '@subwallet/extension-koni-ui/components';
import DualLogo from '@subwallet/extension-koni-ui/components/Logo/DualLogo';
import QrScannerErrorNotice from '@subwallet/extension-koni-ui/components/QrScanner/ErrorNotice';
import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useAutoNavigateToCreatePassword from '@subwallet/extension-koni-ui/hooks/router/autoNavigateToCreatePassword';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { checkPublicAndPrivateKey, createAccountWithSecret } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { QrAccount } from '@subwallet/extension-koni-ui/types/scanner';
import { ValidateState } from '@subwallet/extension-koni-ui/types/validator';
import { importQrScan } from '@subwallet/extension-koni-ui/util/scanner/attach';
import { Form, Icon, Image, ModalContext, SwQrScanner } from '@subwallet/react-ui';
import { ScannerResult } from '@subwallet/react-ui/es/sw-qr-scanner';
import CN from 'classnames';
import { Info, QrCode, Scan } from 'phosphor-react';
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

const MODAL_ID = 'import-qr-modal';

const Component: React.FC<Props> = (props: Props) => {
  useAutoNavigateToCreatePassword();

  const { className } = props;
  const { t } = useTranslation();
  const goHome = useDefaultNavigate().goHome;

  const accountName = useGetDefaultAccountName();

  const [validateState, setValidateState] = useState<ValidateState>({});
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<QrAccount | null>(null);
  const { activeModal, inactiveModal } = useContext(ModalContext);

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

    if (_account && JSON.stringify(account) !== JSON.stringify(_account)) {
      setAccount(_account);

      checkAccount(_account)
        .then((isEthereum) => {
          createAccountWithSecret({ name: accountName,
            isAllow: true,
            secretKey: _account.content,
            publicKey: _account.genesisHash,
            isEthereum: isEthereum })
            .then(({ errors, success }) => {
              if (success) {
                inactiveModal(MODAL_ID);
                setValidateState({});
                goHome();
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
    } else {
      setLoading(false);
    }
  }, [account, accountName, goHome, inactiveModal]);

  const openCamera = useCallback(() => {
    activeModal(MODAL_ID);
  }, [activeModal]);

  const closeCamera = useCallback(() => {
    inactiveModal(MODAL_ID);
  }, [inactiveModal]);

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
          icon: (
            <Icon
              phosphorIcon={Info}
              size='sm'
            />
          )
        }
      ]}
      subHeaderPaddingVertical={true}
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
          {t('Click the "Scan the QR code" button, or read this instruction for more details.')}
        </div>
        <Form.Item
          help={validateState.message}
          validateStatus={validateState.status}
        />
        <SwQrScanner
          className={className}
          id={MODAL_ID}
          isError={!!validateState.status}
          onClose={closeCamera}
          onError={onError}
          onSuccess={onSuccess}
          overlay={validateState.message && (<QrScannerErrorNotice message={validateState.message} />)}
        />
      </div>
    </Layout.Base>
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
    }
  };
});

export default ImportQrCode;
