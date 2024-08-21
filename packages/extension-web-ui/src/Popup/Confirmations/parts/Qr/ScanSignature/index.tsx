// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import QrScannerErrorNotice from '@subwallet/extension-web-ui/components/Qr/Scanner/ErrorNotice';
import { CONFIRMATION_SCAN_MODAL } from '@subwallet/extension-web-ui/constants/modal';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { ScannerResult, SigData, ThemeProps } from '@subwallet/extension-web-ui/types';
import { ModalContext, SwQrScanner } from '@subwallet/react-ui';
import React, { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isHex } from '@polkadot/util';

interface Props extends ThemeProps {
  onSignature: (signature: SigData) => void;
}

const modalId = CONFIRMATION_SCAN_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { onSignature } = props;

  const { t } = useTranslation();

  const { inactiveModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);

  const [error, setError] = useState('');

  const onSuccess = useCallback((result: ScannerResult) => {
    const signature = `0x${result.text}`;

    if (isHex(signature)) {
      inactiveModal(modalId);
      onSignature({
        signature: signature
      });
    } else {
      setError(t('Invalid signature!'));
    }
  }, [onSignature, inactiveModal, t]);

  const onError = useCallback((error: string) => {
    setError(error);
  }, []);

  const onClose = useCallback(() => {
    setError('');
  }, []);

  return (
    <SwQrScanner
      id={modalId}
      isError={!!error}
      onClose={onClose}
      onError={onError}
      onSuccess={onSuccess}
      overlay={error && <QrScannerErrorNotice message={error} />}
      selectCameraMotion={isWebUI ? 'move-right' : undefined}
      title={t('Scan signature')}
    />
  );
};

const ScanSignature = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default ScanSignature;
