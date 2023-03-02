// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { wrapBytes } from '@subwallet/extension-dapp';
import { Layout } from '@subwallet/extension-koni-ui/components';
import DisplayPayload from '@subwallet/extension-koni-ui/components/Qr/Display/DisplayPayload';
import { CONFIRMATION_QR_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { QrCode } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { ExtrinsicPayload } from '@polkadot/types/interfaces';

interface Props extends ThemeProps {
  address: string;
  genesisHash: string;
  payload: ExtrinsicPayload | string;
}

const modalId = CONFIRMATION_QR_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { address, className, genesisHash, payload } = props;

  const { t } = useTranslation();

  const { inactiveModal } = useContext(ModalContext);

  const payloadU8a = useMemo(() => typeof payload === 'string' ? wrapBytes(payload) : payload.toU8a(), [payload]);
  const isMessage = useMemo(() => typeof payload === 'string', [payload]);

  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

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
          onClick: closeModal,
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
          <DisplayPayload
            address={address}
            genesisHash={genesisHash}
            isEthereum={false}
            isHash={false}
            isMessage={isMessage}
            payload={payloadU8a}
          />
        </div>
      </Layout.WithSubHeaderOnly>
    </SwModal>
  );
};

const DisplaySubstrateQr = styled(Component)<Props>(({ theme: { token } }: Props) => {
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

export default DisplaySubstrateQr;
