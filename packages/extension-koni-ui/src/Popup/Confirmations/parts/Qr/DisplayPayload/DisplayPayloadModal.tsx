// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { BaseModal } from '@subwallet/extension-koni-ui/components/Modal/BaseModal';
import { CONFIRMATION_QR_MODAL, CONFIRMATION_SCAN_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import useOpenQrScanner from '@subwallet/extension-koni-ui/hooks/qr/useOpenQrScanner';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, ModalContext, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import { QrCode, X } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children: React.ReactNode;
}

const modalId = CONFIRMATION_QR_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { isWebUI } = useContext(ScreenContext);
  const { children, className } = props;

  const { t } = useTranslation();

  const { inactiveModal } = useContext(ModalContext);

  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const openCamera = useOpenQrScanner(CONFIRMATION_SCAN_MODAL);

  const onScan = useCallback(() => {
    inactiveModal(modalId);
    openCamera();
  }, [openCamera, inactiveModal]);

  if (isWebUI) {
    return (
      <BaseModal
        center={true}
        className={CN(className, '-web-ui')}
        closable={false}
        destroyOnClose={true}
        id={modalId}
        transitionName={'fade'}
      >
        <SwSubHeader
          background='transparent'
          center={true}
          className='__header'
          left={(
            <Icon
              phosphorIcon={X}
              size='md'
            />
          )}
          onBack={closeModal}
          showBackButton
          title={t('Confirm')}
        />
        <div className='body-container'>
          {children}
        </div>
        <div className={'__button-wrapper'}>
          <Button
            block={true}
            className={'__button'}
            icon={(
              <Icon
                phosphorIcon={QrCode}
                weight='fill'
              />
            )}
            onClick={onScan}
          >
            {t('Scan QR')}
          </Button>
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      className={CN(className, 'modal-full')}
      closable={false}
      destroyOnClose={true}
      id={modalId}
      transitionName={'fade'}
    >
      <Layout.WithSubHeaderOnly
        onBack={closeModal}
        rightFooterButton={{
          onClick: onScan,
          children: t('Scan QR'),
          icon: (
            <Icon
              phosphorIcon={QrCode}
              weight='fill'
            />
          )
        }}
        showBackButton={true}
        title={t('Confirm')}
      >
        <div className='body-container'>
          {children}
        </div>
      </Layout.WithSubHeaderOnly>
    </BaseModal>
  );
};

const DisplayPayloadModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      padding: `0 ${token.padding}px`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: token.padding * 4
    },

    '&.-web-ui': {
      '.__header': {
        paddingTop: token.padding,
        paddingBottom: token.padding,
        borderBottom: `2px solid ${token.colorBgSecondary}`
      },

      '.ant-sw-modal-content': {
        paddingTop: 0
      },

      '.ant-sw-modal-body': {
        display: 'flex',
        flexDirection: 'column',
        padding: 0
      },

      '.body-container': {
        flex: 1,
        paddingTop: 32,
        paddingBottom: 16
      },

      '.__button-wrapper': {
        padding: token.padding
      }
    }
  };
});

export default DisplayPayloadModal;
