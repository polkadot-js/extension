// Copyright 2017-2022 @polkadot/react-qr authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useCreateQrPayload from '@subwallet/extension-koni-ui/hooks/qr/useCreateQrPayload';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { createImgSize } from '@polkadot/react-qr/util';

interface Props extends ThemeProps{
  className?: string;
  size?: string | number;
  skipEncoding?: boolean;
  style?: React.CSSProperties;
  value: Uint8Array;
}

const QrDisplay = ({ className,
  size,
  skipEncoding,
  style,
  value }: Props) => {
  const { images, index: imageIndex } = useCreateQrPayload(value, skipEncoding);

  const containerStyle = useMemo(() => createImgSize(size), [size]); // run on initial load to setup the global timer and provide and unsubscribe

  if (!images.length) {
    return null;
  }

  return (
    <div
      className={CN(className)}
      style={containerStyle}
    >
      <div
        className={'ui--qr-Display'}
        style={style}
      >
        {images.map((image, _index) => {
          return (
            <img
              alt={`qr-code_${_index}`}
              className={CN({ hidden: imageIndex !== _index })}
              key={_index}
              src={image}
            />
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(styled(QrDisplay)(({ theme }: Props) => `
  .ui--qr-Display {
    height:100%;
    width:100%;

    img,svg {
      background:white;
      height:auto !important;
      max-height:100%;
      max-width:100%;
      width:auto !important;
    }

    .hidden {
      display: none;
    }
  }
`));
