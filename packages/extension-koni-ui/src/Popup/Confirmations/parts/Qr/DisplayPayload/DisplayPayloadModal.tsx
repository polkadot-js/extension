// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { CONFIRMATION_QR_MODAL, CONFIRMATION_SCAN_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useOpenQrScanner from '@subwallet/extension-koni-ui/hooks/qr/useOpenQrScanner';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { QrCode } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children: React.ReactNode;
}

const modalId = CONFIRMATION_QR_MODAL;

const Component: React.FC<Props> = (props: Props) => {
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

  return (
    <SwModal
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
    </SwModal>
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
    }
  };
});

export default DisplayPayloadModal;
