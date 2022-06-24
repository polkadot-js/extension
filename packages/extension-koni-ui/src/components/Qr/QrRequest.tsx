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
import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

import { QrScanSignature } from '@polkadot/react-qr';
import { SignerResult } from '@polkadot/types/types';
import { hexToU8a, isHex } from '@polkadot/util';

interface Props extends ThemeProps{
  children: JSX.Element;
  className?: string;
  errorArr: string[];
  genesisHash: string;
  handlerStart: () => void;
  isBusy: boolean;
}

const QrRequest = (props: Props) => {
  const { t } = useTranslation();
  const { children, className, errorArr, genesisHash, handlerStart, isBusy } = props;

  const { QrState, updateQrState } = useContext(QrContext);
  const { createResolveExternalRequestData } = useContext(ExternalRequestContext);

  const [loading, setLoading] = useState(false);

  const { isEthereum, isQrHashed, qrAddress, qrId, qrPayload, step } = QrState;

  const handlerChangeToScan = useCallback(() => {
    updateQrState({ step: QrStep.SCAN_QR });
  }, [updateQrState]);

  const handlerChangeToDisplayQr = useCallback(() => {
    updateQrState({ step: QrStep.DISPLAY_PAYLOAD });
  }, [updateQrState]);

  const handlerResolve = useCallback(async (result: SignerResult) => {
    if (qrId) {
      setLoading(true);
      await resolveExternalRequest({ id: qrId, data: result });
      setLoading(false);
    }
  }, [qrId]);

  const handlerScanSignature = useCallback(async (data: SigData): Promise<void> => {
    if (isHex(data.signature) && !loading) {
      const resolveData = createResolveExternalRequestData(data);

      await handlerResolve(resolveData);
    }
  }, [handlerResolve, createResolveExternalRequestData, loading]);

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
  display: flex;
  flex: 1;

  .auth-transaction-body{
    flex: 1;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    padding-top: 25px;
    overflow-y: auto;
  }

  .auth-transaction__separator {
    padding-top: 24px;
    margin-bottom: 24px;
    border-bottom: 1px solid ${theme.menuItemsBorder};
  }

  .auth-transaction__submit-wrapper {
    position: sticky;
    bottom: -15px;
    padding: 15px;
    margin-left: -15px;
    margin-bottom: -15px;
    margin-right: -15px;
    background-color: ${theme.background};
  }

  .display-qr {
    margin: 0 30px;
    display: flex;
    justify-content: center;
    align-items: center;

    .qr-content {
      height: 324px;
      width: 324px;
      border: 2px solid ${theme.textColor};
    }
  }

  .scan-qr {
    margin: 0 20px;
  }

  .auth-transaction-error {
    margin-top: 10px
  }
`));
