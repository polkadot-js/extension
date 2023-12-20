// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { OrdinalNftProperties } from '@subwallet/extension-base/types';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  properties: OrdinalNftProperties;
  alone?: boolean;
}

const Component: React.FC<Props> = (props: Props) => {
  const { alone, className, properties } = props;
  const { token } = useTheme() as Theme;

  const data = useMemo(() => {
    return {
      p: properties.P.value,
      op: properties.Op.value,
      tick: properties.Tick.value
    };
  }, [properties]);

  const ratio = useMemo(() => {
    const size = alone ? 400 : 250;
    const expect = token.fontSizeSuper2;
    const current = (size / data.tick.length);

    if (current > expect) {
      return 1;
    }

    return current / expect;
  }, [alone, data.tick.length, token.fontSizeSuper2]);

  return (
    <div className={CN(className, { bordered: alone })}>
      <div className='content'>
        <div
          className='tick'
          style={{
            fontSize: token.fontSizeSuper2 * ratio,
            lineHeight: token.lineHeightSuper2
          }}
        >
          {data.tick}
        </div>
        <div className='other'>
          {data.p}
          &nbsp;
          {data.op}
        </div>
      </div>
    </div>
  );
};

const InscriptionImage = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    backgroundColor: token.colorBgInput,
    position: 'relative',
    height: '100%',
    overflow: 'hidden',

    '&.bordered': {
      borderRadius: token.sizeXS
    },

    '.content': {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translateX(-50%) translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      whiteSpace: 'nowrap',
      alignItems: 'center'
    },

    '.tick': {
      color: token.colorText,
      fontSize: token.fontSizeSuper2,
      lineHeight: token.lineHeightSuper2
    },

    '.other': {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: token.sizeXS,
      color: token.colorTextTertiary,
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4
    }
  };
});

export default InscriptionImage;
