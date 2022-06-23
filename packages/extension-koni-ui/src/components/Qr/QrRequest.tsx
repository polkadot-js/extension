// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LoadingContainer, Warning } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import DisplayPayload from '@subwallet/extension-koni-ui/components/Qr/DisplayPayload';
import { ExternalRequestContext } from '@subwallet/extension-koni-ui/contexts/ExternalRequestContext';
import { QrContext, QrStep } from '@subwallet/extension-koni-ui/contexts/QrContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { resolveExternalRequest } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SigData } from '@subwallet/extension-koni-ui/types/accountExternalRequest';
import CN from 'classnames';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import { QrScanSignature } from '@polkadot/react-qr';
import { SignerResult } from '@polkadot/types/types';
import { hexToU8a, isHex } from '@polkadot/util';

interface Props extends ThemeProps{
  className?: string;
  errorArr: string[];
  isBusy: boolean;
  genesisHash: string;
  children: JSX.Element;
  handlerStart: () => void;
}

const QrRequest = (props: Props) => {
  const { t } = useTranslation();
  const { children, className, errorArr, genesisHash, handlerStart, isBusy } = props;

  const { QrState, updateQrState } = useContext(QrContext);
  const { createResolveExternalRequestData } = useContext(ExternalRequestContext);

  const { isEthereum, isQrHashed, qrAddress, qrId, qrPayload, step } = QrState;

  const handlerChangeToScan = useCallback(() => {
    updateQrState({ step: QrStep.SCAN_QR });
  }, [updateQrState]);

  const handlerChangeToDisplayQr = useCallback(() => {
    updateQrState({ step: QrStep.DISPLAY_PAYLOAD });
  }, [updateQrState]);

  const handlerResolve = useCallback(async (result: SignerResult) => {
    if (qrId) {
      await resolveExternalRequest({ id: qrId, data: result });
    }
  }, [qrId]);

  const handlerScanSignature = useCallback(async (data: SigData): Promise<void> => {
    if (isHex(data.signature)) {
      const resolveData = createResolveExternalRequestData(data);

      await handlerResolve(resolveData);
    }
  }, [handlerResolve, createResolveExternalRequestData]);

  const renderError = useCallback(() => {
    if (errorArr && errorArr.length) {
      return errorArr.map((err) =>
        (
          <Warning
            className='auth-transaction-error'
            isDanger
            key={err}
          >
            {t<string>(err)}
          </Warning>
        )
      );
    } else {
      return <></>;
    }
  }, [errorArr, t]);

  const handlerRenderContent = useCallback(() => {
    switch (step) {
      case QrStep.SENDING_TX:
        return (
          <div className='auth-transaction-body'>
            <LoadingContainer />
          </div>
        );
      case QrStep.SCAN_QR:
        return (
          <div className='auth-transaction-body'>
            <div className='scan-qr'>
              <QrScanSignature
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onScan={handlerScanSignature}
              />
            </div>
            <div className='auth-transaction__separator' />
            {renderError()}
            <div className='auth-transaction__submit-wrapper'>
              <Button
                className={'auth-transaction__submit-btn'}
                onClick={handlerChangeToDisplayQr}
              >
                {t<string>('Back to previous step')}
              </Button>
            </div>
          </div>
        );
      case QrStep.DISPLAY_PAYLOAD:
        return (
          <div className='auth-transaction-body'>
            <div className='display-qr'>
              <div className='qr-content'>
                <DisplayPayload
                  address={qrAddress}
                  genesisHash={genesisHash}
                  isEthereum={isEthereum}
                  isHash={isQrHashed}
                  payload={hexToU8a(qrPayload)}
                  size={320}
                />
              </div>
            </div>
            <div className='auth-transaction__separator' />
            {renderError()}
            <div className='auth-transaction__submit-wrapper'>
              <Button
                className={'auth-transaction__submit-btn'}
                onClick={handlerChangeToScan}
              >
                {t<string>('Scan QR')}
              </Button>
            </div>
          </div>
        );
      case QrStep.TRANSACTION_INFO:
      default:
        return (
          <div className='auth-transaction-body'>
            {children}
            <div className='auth-transaction__separator' />
            {renderError()}
            <div className='auth-transaction__submit-wrapper'>
              <Button
                className={'auth-transaction__submit-btn'}
                isBusy={isBusy}
                onClick={handlerStart}
              >
                {t<string>('Sign via QR')}
              </Button>
            </div>
          </div>
        );
    }
  }, [genesisHash, handlerChangeToDisplayQr, handlerChangeToScan, handlerScanSignature, isBusy, isEthereum, isQrHashed, qrAddress, qrPayload, renderError, step, t, children, handlerStart]);

  return (
    <div className={CN(className)}>
      { handlerRenderContent() }
    </div>
  );
};

export default React.memo(styled(QrRequest)(({ theme }: Props) => `

`));
