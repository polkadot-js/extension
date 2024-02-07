// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme } from '@subwallet/extension-web-ui/themes';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React, { Context, useContext } from 'react';
import styled, { ThemeContext } from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
}

function Component ({ className }: Props): React.ReactElement<Props> {
  const token = useContext<Theme>(ThemeContext as Context<Theme>).token;

  return (
    <div className={CN(className, 'loading-layer')}>
      <svg
        className='default-loading-icon'
        height='200px'
        preserveAspectRatio='xMidYMid'
        viewBox='0 0 100 100'
        width='200px'
      >
        <circle
          cx='50'
          cy='50'
          fill='none'
          r='27'
          stroke={token.colorTextTertiary}
          strokeDasharray='42.411500823462205 42.411500823462205'
          strokeLinecap='round'
          strokeWidth='3'
        >
          <animateTransform
            attributeName='transform'
            dur='1'
            keyTimes='0;1'
            repeatCount='indefinite'
            type='rotate'
            values='0 50 50;360 50 50'
          ></animateTransform>
        </circle>
      </svg>
    </div>
  );
}

const LoadingScreen = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    position: 'relative',

    '&.root-loading': {
      '.default-loading-icon': {
        opacity: 0
      }
    },

    '.default-loading-icon': {
      margin: '0 auto',
      width: 100
    }
  };
});

export default LoadingScreen;
