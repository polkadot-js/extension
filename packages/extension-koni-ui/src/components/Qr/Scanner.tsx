// Copyright 2017-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Result } from '@zxing/library';
import CN from 'classnames';
import React from 'react';
import { QrReader } from 'react-qr-reader';
import styled from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
  onResult: (result: Result | undefined | null, error: Error | undefined | null) => void;
}

const Scanner = (props: Props) => {
  const { className, onResult } = props;

  return (
    <div className={CN(className)}>
      <div className={'scanner'}>
        <QrReader
          className={'qr-scanner-container'}
          constraints={{ facingMode: 'user', aspectRatio: 1 }}
          onResult={onResult}
          scanDelay={150}
        />
      </div>
    </div>
  );
};

export default React.memo(styled(Scanner)(({ theme }: Props) => `
  position: relative;
  padding: 5px 40px 0 40px;

  .scanner {
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
