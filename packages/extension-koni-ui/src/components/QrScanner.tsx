// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Result } from '@zxing/library';
import CN from 'classnames';
import React, { useCallback } from 'react';
import { QrReader } from 'react-qr-reader';
import styled from 'styled-components';

import { hexStripPrefix, u8aToHex } from '@polkadot/util';
import { blake2AsU8a } from '@polkadot/util-crypto';

interface Props extends ThemeProps{
  className?: string;
  onError?: (error: Error) => void;
  onScan: (data: string) => void;
  size?: string | number;
  style?: React.CSSProperties;
}

export function decodeString (value: Uint8Array): string {
  return value.reduce((str, code): string => {
    return str + String.fromCharCode(code);
  }, '');
}

const QrScanner = (props: Props) => {
  const { className, onError, onScan } = props;

  const handlerOnResult = useCallback((result: Result | undefined | null, error: Error | undefined | null) => {
    if (result) {
      console.log(result);
      const bytes = result.getRawBytes();
      const frameInfo = hexStripPrefix(u8aToHex(bytes.slice(0, 5)));
      const frameCount = parseInt(frameInfo.substr(2, 4), 16);
      const isMultipart = frameCount > 1; // for simplicity, even single frame payloads are marked as multipart.

      console.log(frameInfo, frameCount, isMultipart);
      console.log(blake2AsU8a(bytes));
      console.log(u8aToHex(bytes));

      onScan && onScan('text');
    }

    if (error) {
      onError && onError(error);
    }
  }, [onError, onScan]);

  return (
    <div className={CN(className)}>
      <QrReader
        className={'qr-scanner-container'}
        constraints={{}}
        onResult={handlerOnResult}
      />
    </div>
  );
};

export default React.memo(styled(QrScanner)(({ theme }: Props) => `
  display:inline-block;
  height:100%;
  transform:matrix(-1,0,0,1,0,0);
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
`));
