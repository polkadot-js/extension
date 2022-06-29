// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SCANNER_QR_STEP } from '@subwallet/extension-koni-ui/constants/scanner';
import { ScannerContext, ScannerContextType } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Header } from '@subwallet/extension-koni-ui/partials';
import QRResult from '@subwallet/extension-koni-ui/Popup/ExternalRequest/QRResult';
import QRScanner from '@subwallet/extension-koni-ui/Popup/ExternalRequest/QRScanner';
import ViewQRDetail from '@subwallet/extension-koni-ui/Popup/ExternalRequest/ViewQRDetail';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import SignQR from './SignQR';

interface Props extends ThemeProps {
  className?: string;
}

const ExternalRequest = (props: Props) => {
  const { t } = useTranslation();
  const { className } = props;
  const { setStep, state } = useContext<ScannerContextType>(ScannerContext);
  const { step } = state;

  const handlerRenderContent = useCallback(() => {
    switch (step) {
      case SCANNER_QR_STEP.SCAN_STEP:
        return <QRScanner />;
      case SCANNER_QR_STEP.VIEW_DETAIL_STEP:
        return <ViewQRDetail />;
      case SCANNER_QR_STEP.CONFIRM_STEP:
        return <SignQR />;
      case SCANNER_QR_STEP.FINAL_STEP:
        return <QRResult />;
      default:
        return <></>;
    }
  }, [step]);

  const handlerBackToHome = useCallback(() => {
    setStep(SCANNER_QR_STEP.SCAN_STEP);
  }, [setStep]);

  return (
    <div className={className}>
      <Header
        onBack={handlerBackToHome}
        onCancel={handlerBackToHome}
        showBackArrow
        showCancelButton
        showSubHeader
        subHeaderName={t<string>('Scan Qr')}
      />
      <div className={'import-qr-content'}>
        {handlerRenderContent()}
      </div>
    </div>
  );
};

export default React.memo(styled(ExternalRequest)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  height: 100%;

  .import-qr-content {
    flex: 1;
    overflow-y: auto;
  }
`));
