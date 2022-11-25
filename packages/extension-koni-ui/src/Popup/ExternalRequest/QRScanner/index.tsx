// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import ProgressBar from '@ramonak/react-progress-bar';
import { Button, Warning } from '@subwallet/extension-koni-ui/components';
import { ScannerContext } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import usePayloadScanner from '@subwallet/extension-koni-ui/hooks/qr/usePayloadScanner';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { noop } from '@subwallet/extension-koni-ui/util/function';
import { Result } from '@zxing/library';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { QrReader } from 'react-qr-reader';
import styled from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
  size?: string | number;
  style?: React.CSSProperties;
}

let onSuccess: (result: Result) => void = noop;

const QRScanner = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();

  const { cleanup, clearMultipartProgress, state: { completedFramesCount, totalFrameCount } } = useContext(ScannerContext);

  const [error, setError] = useState<string>('');

  const handlerAlertMessage = useCallback((message: string) => {
    setError(message);
  }, []);

  const onStartOver = useCallback(() => {
    clearMultipartProgress();
    setError('');
  }, [clearMultipartProgress]);

  const handlerOnProcessQrCode = usePayloadScanner(handlerAlertMessage);

  useEffect(() => {
    onSuccess = handlerOnProcessQrCode;

    return () => {
      onSuccess = noop;
    };
  }, [handlerOnProcessQrCode]);

  const handlerOnResult = useCallback((result: Result | undefined | null) => {
    if (result) {
      try {
        // QrReader not replace onResult function so use the 'let' variable to store the handler function address
        onSuccess(result);
      } catch (e) {

      }
    }
  }, []);

  useEffect(() => {
    cleanup();
  }, [cleanup]);

  return (
    <div className={CN(className)}>
      {
        error && (
          <Warning
            className='item-error'
            isDanger
          >
            {t<string>(error)}
          </Warning>
        )
      }
      <div className={'scanner-wrapper'}>
        <div className={'scanner'}>
          <QrReader
            className={'qr-scanner-container'}
            constraints={{ facingMode: 'user' }}
            onResult={handlerOnResult}
            scanDelay={100}
          />
        </div>
      </div>
      {
        !!totalFrameCount && (
          <div className='progress-container'>
            <ProgressBar
              baseBgColor={'#FFF'}
              bgColor={'#004BFF'}
              completed={completedFramesCount / totalFrameCount * 100}
              customLabel={' '}
              height={'4px'}
            />
            <div className='progress-text'>
              {completedFramesCount} / { totalFrameCount}
            </div>
            <Button
              className='start-over-button'
              onClick={onStartOver}
            >Start over</Button>
          </div>
        )
      }
    </div>
  );
};

export default React.memo(styled(QRScanner)(({ theme }: Props) => `

  .item-error {
    margin: 16px 15px 8px;
  }

  .scanner-wrapper {
    padding: 5px 15px 0;
    position: relative;

    .scanner{
      display:inline-block;
      height:100%;
      transform:matrix(1,0,0,1,0,0);
      width:100%;
      video{
        margin:0;
        object-fit: cover;
      }

      .qr-scanner-container{
        &::after{
          width: 100%;
          content: '';
          top: 0px;
          left: 0px;
          z-index: 1;
          box-sizing: border-box;
          border: 50px solid rgba(0, 0, 0, 0.3);
          box-shadow: rgb(255 0 0 / 50%) 0px 0px 0px 5px inset;
          position: absolute;
          height: 100%;
        }
      }
    }
  }

  .progress-container {
    width: 100%;
    padding: 8px 15px 16px;

    .progress-text {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 24px;
      text-align: right;
      color: ${theme.textColor};
      margin-bottom: 8px;
    }

    .start-over-button {
      width: 170px;
      margin: auto;
    }
  }
`));
