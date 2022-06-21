// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Warning } from '@subwallet/extension-koni-ui/components';
import useScanner from '@subwallet/extension-koni-ui/hooks/useScanner';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Result } from '@zxing/library';
import CN from 'classnames';
import React, { useCallback, useState } from 'react';
import { QrReader } from 'react-qr-reader';
import styled from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
  onError?: (error: Error) => void;
  size?: string | number;
  style?: React.CSSProperties;
}

const QRScanner = (props: Props) => {
  const { className, onError } = props;

  const { t } = useTranslation();

  const [error, setError] = useState<string>('');

  const handlerAlertMessage = useCallback((message: string) => {
    setError(message);
  }, []);

  const handlerOnProcessQrCode = useScanner(handlerAlertMessage);

  const handlerOnResult = useCallback((result: Result | undefined | null, error: Error | undefined | null) => {
    if (result) {
      try {
        handlerOnProcessQrCode(result);
      } catch (e) {

      }
    }

    if (error && error.message) {
      onError && onError(error);
      setError(error.message);
    }
  }, [handlerOnProcessQrCode, onError]);

  return (
    <div className={CN(className)}>
      <div className={'scanner'}>
        <QrReader
          className={'qr-scanner-container'}
          constraints={{ facingMode: 'user' }}
          onResult={handlerOnResult}
          scanDelay={150}
        />
      </div>
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
    </div>
  );
};

export default React.memo(styled(QRScanner)(({ theme }: Props) => `

  .item-error {
    margin-top: 10px;
  }

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
`));
