// Copyright 2017-2022 @polkadot/react-qr authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useCreateQrPayload } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { createImgSize } from '@subwallet/extension-web-ui/utils';
import { SwQRCode } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  size?: string | number;
  skipEncoding?: boolean;
  style?: React.CSSProperties;
  value: Uint8Array;
}

const Component = ({ className,
  size,
  skipEncoding,
  style,
  value }: Props) => {
  const { data, index: dataIndex } = useCreateQrPayload(value, skipEncoding);

  const containerStyle = useMemo(() => createImgSize(size), [size]); // run on initial load to setup the global timer and provide and unsubscribe

  if (!data.length) {
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
        {data.map((datum, _index) => {
          return (
            <SwQRCode
              className={CN({ hidden: dataIndex !== _index })}
              color='#000'
              errorLevel='Q'
              icon=''
              ignoreEncode={true}
              key={_index}
              size={264}
              value={datum}
            />
          );
        })}
      </div>
    </div>
  );
};

const BytesQr = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.ui--qr-Display': {
      height: '100%',
      width: '100%',

      'img,svg': {
        background: token.colorTextBase,
        height: 'auto !important',
        maxHeight: '100%',
        maxWidth: '100%',
        width: 'auto !important'
      },

      '.hidden': {
        display: 'none'
      }
    }
  };
});

export default BytesQr;
